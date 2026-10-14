"""Bounded public literature discovery, selected reading and explicit source registration."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import time
from datetime import date
from urllib.error import HTTPError
from urllib.parse import urlencode, urlparse, quote
from urllib.request import Request, HTTPRedirectHandler, build_opener
import xml.etree.ElementTree as ET

import alignment_common as common
import research

PROVIDERS = {"crossref", "pubmed", "openalex", "biorxiv", "alphaxiv", "arxiv"}
HOSTS = {"api.crossref.org", "api.openalex.org", "content.openalex.org", "openalex.org", "api.alphaxiv.org", "www.alphaxiv.org", "arxiv.org", "export.arxiv.org", "www.arxiv.org", "api.biorxiv.org", "www.biorxiv.org", "eutils.ncbi.nlm.nih.gov", "www.ncbi.nlm.nih.gov", "pmc.ncbi.nlm.nih.gov", "oa.fcgi.ncbi.nlm.nih.gov"}
DOI = re.compile(r"10\.\d{4,9}/[^\s]+\Z", re.I)
ARXIV = re.compile(r"(?:\d{4}\.\d{4,5}|[a-z-]+/\d{7})(?:v[1-9]\d*)?\Z", re.I)


class Redirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_url(newurl)
        if req.get_header("Authorization") and urlparse(newurl).hostname != urlparse(req.full_url).hostname:
            raise ValueError("Credentialed request cannot redirect to a different host")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def validate_url(url):
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in HOSTS or parsed.username or parsed.password or parsed.port not in (None, 443):
        raise ValueError("Only fixed HTTPS literature provider hosts are allowed")


def xml(raw, *, pubmed=False):
    raw = raw.decode("utf-8-sig").encode("utf-8")
    if b"\x00" in raw:
        raise ValueError("XML must be UTF-8 without NUL bytes; encoded DTD bypasses are forbidden")
    if pubmed:
        declaration = re.compile(br'<!DOCTYPE\s+PubmedArticleSet\s+PUBLIC\s+"-//NLM//DTD PubMedArticle, [^"\[\]<>]{1,100}//EN"\s+"https://dtd\.nlm\.nih\.gov/ncbi/pubmed/out/pubmed_\d{6}\.dtd"\s*>')
        # Only remove the exact provider catalog declaration; never fetch its DTD or allow an internal subset.
        raw = declaration.sub(b"", raw, count=1)
    if b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper():
        raise ValueError("XML declarations/entities are not accepted")
    return ET.fromstring(raw)


def text(node):
    return "" if node is None else "".join(node.itertext()).strip()


def credentials(spec, provider):
    selected = spec.get("credential_env", {})
    if not isinstance(selected, dict) or set(selected) - {"openalex"}:
        raise ValueError("Only explicitly selected provider credential environment names are supported")
    if provider == "openalex" or provider == "biorxiv":
        name = selected.get("openalex")
        if name not in (None, "OPENALEX_API_KEY"):
            raise ValueError("Unknown OpenAlex credential environment name")
        if name and not os.environ.get(name):
            raise ValueError("Explicitly selected OpenAlex credential is unavailable")
        return {"Authorization": "Bearer " + os.environ[name]} if name else {}
    return {}


class Requests:
    def __init__(self, out, budget=12):
        self.out, self.budget, self.count, self.records = out, budget, 0, []
        self.opener = build_opener(Redirects())

    def get(self, base, params=None, headers=None):
        if self.count >= self.budget:
            raise ValueError("Fixed request budget exhausted")
        url = base + ("?" + urlencode(params) if params else "")
        validate_url(url)
        self.count += 1
        name = f"response-{self.count:02d}"
        record = {"url": url, "retrieved_at": research.now(), "authorization": "explicit environment credential" if headers else "anonymous"}
        self.records.append(record)
        try:
            request = Request(url, headers={"User-Agent": "YanZhouResearch/1.1 (selected public literature)", "Accept-Encoding": "identity", **(headers or {})})
            with self.opener.open(request, timeout=30) as response:
                validate_url(response.url)
                if response.headers.get("Content-Encoding", "identity") not in ("identity", ""):
                    raise ValueError("Unexpected compressed provider response")
                raw = response.read(research.MAX_FILE + 1)
                if len(raw) > research.MAX_FILE:
                    raise ValueError("Provider response exceeds 30 MB")
                content_type = response.headers.get("Content-Type", "")
            (self.out / (name + ".bin")).write_bytes(raw)
            record.update(status="received", bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(), content_type=content_type, raw_file=name + ".bin")
            return raw, content_type
        except HTTPError as error:
            record.update(status="failed", http_status=error.code, error="Provider HTTP " + str(error.code))
            raise ValueError(record["error"]) from error
        except Exception as error:
            record.update(status="failed", error=str(error))
            raise
        finally:
            research.write_json(self.out / "requests.json", self.records)


def abstract_index(value):
    if not isinstance(value, dict):
        return ""
    entries = [(position, word) for word, positions in value.items() for position in positions if isinstance(position, int) and 0 <= position < 100000]
    return " ".join(word for _, word in sorted(entries))


def openalex_hit(item, provider):
    doi = str(item.get("doi") or "").removeprefix("https://doi.org/").lower()
    identifier = doi if provider == "biorxiv" else str(item.get("id", "")).removeprefix("https://openalex.org/")
    if not identifier or not item.get("title"):
        raise ValueError("Provider record lacks identity or title")
    return {"source": provider, "provider_id": identifier, "doi": doi, "title": item["title"], "abstract": abstract_index(item.get("abstract_inverted_index")),
            "authors": "; ".join(str(author.get("author", {}).get("display_name", "unknown")) for author in item.get("authorships", [])),
            "publication_date": item.get("publication_date") or "unknown", "year": str(item.get("publication_year") or "unknown"),
            "url": item.get("id", ""), "citations": item.get("cited_by_count"), "content_level": "metadata", "version": "unknown", "license": "unknown"}


def pubmed_hits(raw):
    root = xml(raw, pubmed=True)
    if root.tag != "PubmedArticleSet":
        raise ValueError("PubMed EFetch did not return an article set")
    hits = []
    for article in root.findall("PubmedArticle") + root.findall("PubmedBookArticle"):
        identifier = text(article.find(".//PMID"))
        title = text(article.find(".//ArticleTitle")) or text(article.find(".//BookTitle"))
        if not re.fullmatch(r"\d{1,12}", identifier) or not title:
            raise ValueError("PubMed identity/title is missing")
        abstract = "\n".join(text(node) for node in article.findall(".//AbstractText"))
        doi = next((text(node).lower() for node in article.findall(".//ArticleId") if node.attrib.get("IdType") == "doi"), "")
        authors = [" ".join(filter(None, [text(author.find("ForeName")), text(author.find("LastName"))])) or text(author.find("CollectiveName")) for author in article.findall(".//Author")]
        hits.append({"source": "pubmed", "provider_id": identifier, "doi": doi, "title": title, "abstract": abstract, "authors": "; ".join(authors) or "unknown",
                     "year": text(article.find(".//PubDate/Year")) or "unknown", "publication_date": text(article.find(".//PubDate/Year")) or "unknown",
                     "url": "https://pubmed.ncbi.nlm.nih.gov/" + identifier + "/", "content_level": "abstract" if abstract else "metadata", "version": "provider-record", "license": "unknown"})
    return hits


def provider_search(provider, spec, requests):
    query, limit = spec["query"], spec["limit"]
    after, before = spec.get("published_after"), spec.get("published_before")
    if provider == "crossref":
        params = {"query.bibliographic": query, "rows": limit}
        filters = []
        if after: filters.append("from-pub-date:" + after)
        if before: filters.append("until-pub-date:" + before)
        if filters: params["filter"] = ",".join(filters)
        raw, _ = requests.get("https://api.crossref.org/works", params)
        data = common.strict_json(raw)
        if data.get("status") != "ok" or not isinstance(data.get("message", {}).get("items"), list):
            raise ValueError("Invalid Crossref response")
        hits = []
        for item in data["message"]["items"]:
            doi = str(item.get("DOI", "")).lower()
            if not DOI.fullmatch(doi) or not item.get("title"):
                continue
            parts = item.get("published", {}).get("date-parts", [[None]])[0]
            date = "-".join(str(value).zfill(2) if index else str(value) for index, value in enumerate(parts)) if parts and parts[0] else "unknown"
            hits.append({"source": provider, "provider_id": doi, "doi": doi, "title": " ".join(item["title"]), "abstract": item.get("abstract", ""),
                         "authors": "; ".join(" ".join(filter(None, [author.get("given"), author.get("family")])) for author in item.get("author", [])) or "unknown",
                         "year": str(parts[0]) if parts and parts[0] else "unknown", "publication_date": date, "url": "https://doi.org/" + doi,
                         "content_level": "metadata", "version": "provider-record", "license": "unknown"})
        return hits
    if provider in ("openalex", "biorxiv"):
        params = {"search": query, "per_page": limit}
        filters = []
        if provider == "biorxiv": filters.append("primary_location.source.id:S4306402567")
        if after: filters.append("from_publication_date:" + after)
        if before: filters.append("to_publication_date:" + before)
        if filters: params["filter"] = ",".join(filters)
        if spec["priority"] == "recency": params["sort"] = "publication_date:desc"
        if spec["priority"] == "popular": params["sort"] = "cited_by_count:desc"
        raw, _ = requests.get("https://api.openalex.org/works", params, credentials(spec, provider))
        data = common.strict_json(raw)
        if not isinstance(data.get("results"), list): raise ValueError("Invalid OpenAlex response")
        return [openalex_hit(item, provider) for item in data["results"]]
    if provider == "pubmed":
        params = {"db": "pubmed", "tool": "YanZhouResearch", "term": query, "retmode": "json", "retmax": limit, "sort": "pub date" if spec["priority"] == "recency" else "relevance"}
        if after or before:
            params.update(datetype="pdat", mindate=(after or "1000-01-01").replace("-", "/"), maxdate=(before or "3000-12-31").replace("-", "/"))
        raw, _ = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", params)
        response = common.strict_json(raw).get("esearchresult", {})
        if response.get("ERROR") or not isinstance(response.get("idlist"), list): raise ValueError("Invalid PubMed search response")
        ids = response["idlist"][:limit]
        if not ids: return []
        if any(not re.fullmatch(r"\d{1,12}", str(identifier)) for identifier in ids): raise ValueError("Invalid PMID")
        raw, _ = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi", {"db": "pubmed", "id": ",".join(ids), "retmode": "xml", "tool": "YanZhouResearch"})
        hits = pubmed_hits(raw)
        if not set(ids).issubset({hit["provider_id"] for hit in hits}): raise ValueError("PubMed fetch omitted requested records")
        return hits
    if provider == "alphaxiv":
        params = {"q": query, "prioritize": spec["priority"]}
        if after: params["publishedAfter"] = after
        if before: params["publishedBefore"] = before
        raw, _ = requests.get("https://api.alphaxiv.org/search/v2/paper/discover/" + spec["strategy"], params)
        data = common.strict_json(raw)
        if not isinstance(data, list): raise ValueError("Invalid alphaXiv response")
        hits = []
        for item in data[:limit]:
            identifier = str(item.get("paperId", ""))
            if not ARXIV.fullmatch(identifier) or not item.get("title"): raise ValueError("Invalid alphaXiv identity")
            hits.append({"source": provider, "provider_id": identifier, "arxiv_id": identifier, "doi": "", "title": item["title"], "abstract": item.get("abstract", ""), "authors": "unknown",
                         "publication_date": item.get("publicationDate") or "unknown", "year": str(item.get("publicationDate", ""))[:4] or "unknown", "url": "https://www.alphaxiv.org/abs/" + identifier,
                         "votes": item.get("votes"), "snippets": item.get("snippets", []), "content_level": "metadata", "version": re.search(r"v\d+$", identifier).group() if re.search(r"v\d+$", identifier) else "unknown", "license": "unknown"})
        return hits
    params = {"search_query": "all:" + query, "start": 0, "max_results": limit, "sortBy": "submittedDate" if spec["priority"] == "recency" else "relevance", "sortOrder": "descending"}
    raw, _ = requests.get("https://export.arxiv.org/api/query", params)
    ns = {"a": "http://www.w3.org/2005/Atom", "ar": "http://arxiv.org/schemas/atom"}
    hits = []
    for entry in xml(raw).findall("a:entry", ns):
        identifier = text(entry.find("a:id", ns)).rsplit("/abs/", 1)[-1]
        if not ARXIV.fullmatch(identifier): raise ValueError("Invalid arXiv identity")
        date = text(entry.find("a:published", ns))[:10]
        if after and date < after or before and date > before: continue
        hits.append({"source": "arxiv", "provider_id": identifier, "arxiv_id": identifier, "doi": text(entry.find("ar:doi", ns)).lower(), "title": text(entry.find("a:title", ns)),
                     "abstract": text(entry.find("a:summary", ns)), "authors": "; ".join(text(node.find("a:name", ns)) for node in entry.findall("a:author", ns)), "publication_date": date,
                     "year": date[:4], "url": "https://arxiv.org/abs/" + identifier, "content_level": "abstract", "version": identifier.rsplit("v", 1)[-1] if "v" in identifier else "unknown", "license": "unknown"})
    return hits


def search(ws, args):
    specpath = ws.input(args.spec, {".json"})
    spec = common.strict_json(specpath)
    allowed = {"query", "sources", "limit", "priority", "strategy", "difficulty", "round", "cycle", "max_requests", "published_after", "published_before", "credential_env", "disabled_sources", "gap_reason", "purpose"}
    if not isinstance(spec, dict) or set(spec) - allowed:
        raise ValueError("Unknown literature specification fields; never put credentials in input files")
    spec.setdefault("limit", 15); spec.setdefault("priority", "default"); spec.setdefault("strategy", "keyword")
    spec.setdefault("difficulty", 5); spec.setdefault("round", 0); spec.setdefault("cycle", 1); spec.setdefault("max_requests", 12)
    if not isinstance(spec.get("query"), str) or not spec["query"].strip() or len(spec["query"]) > 500: raise ValueError("Query must contain 1–500 characters")
    if not isinstance(spec.get("sources"), list) or not spec["sources"] or set(spec["sources"]) - PROVIDERS or len(spec["sources"]) != len(set(spec["sources"])): raise ValueError("Select distinct supported literature sources")
    if type(spec["limit"]) is not int or not 1 <= spec["limit"] <= 50: raise ValueError("Candidate limit must be 1–50")
    if spec["priority"] not in ("default", "historical", "recency", "popular") or spec["strategy"] not in ("keyword", "embedding"): raise ValueError("Unsupported strategy/priority")
    if type(spec["difficulty"]) is not int or not 1 <= spec["difficulty"] <= 10: raise ValueError("Difficulty must be 1–10")
    rounds = 0 if spec["difficulty"] <= 3 else 1 if spec["difficulty"] <= 7 else 2
    if type(spec["round"]) is not int or not 0 <= spec["round"] <= rounds or type(spec["cycle"]) is not int or not 1 <= spec["cycle"] <= 4 or spec["cycle"] >= 3 and spec["round"] != 0: raise ValueError("Literature loop budget exceeded")
    if type(spec["max_requests"]) is not int or not 1 <= spec["max_requests"] <= 24: raise ValueError("Request budget must be 1–24")
    for key in ("published_after", "published_before"):
        if spec.get(key):
            if not isinstance(spec[key], str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", spec[key]): raise ValueError("Date window requires ISO dates")
            date.fromisoformat(spec[key])
    if spec.get("published_after") and spec.get("published_before") and spec["published_after"] > spec["published_before"]: raise ValueError("Reversed date window")
    credentials(spec, "openalex")
    previous = common.extension_record(ws, "literature", args.previous) if args.previous else None
    disabled = spec.get("disabled_sources", [])
    if not isinstance(disabled, list) or any(not isinstance(item, str) for item in disabled) or not set(disabled).issubset(spec["sources"]) or len(set(disabled)) != len(disabled):
        raise ValueError("Disabled sources must be distinct members of the selected source list")
    if (spec["round"] or spec["cycle"] > 1) and (not previous or not isinstance(spec.get("gap_reason"), str) or not spec["gap_reason"].strip()): raise ValueError("Follow-up requires a previous record and a concrete gap reason")
    if previous:
        old = common.strict_json(previous / "query-spec.json")
        next_round = spec["cycle"] == old["cycle"] and spec["round"] == old["round"] + 1
        next_cycle = spec["cycle"] == old["cycle"] + 1 and spec["round"] == 0
        if any(old.get(key) != spec.get(key) for key in ("published_after", "published_before", "priority", "difficulty", "max_requests")) or not (next_round or next_cycle): raise ValueError("Follow-up changes the bound window/budget or skips a cycle")
    inputs = [specpath] + ([previous / "receipt.json"] if previous else [])
    def run(out):
        requests = Requests(out, spec["max_requests"])
        hits, statuses = [], []
        if previous: hits.extend(common.strict_json(previous / "candidates.json"))
        for provider in spec["sources"]:
            if provider in spec.get("disabled_sources", []):
                statuses.append({"source": provider, "status": "disabled"}); continue
            try:
                if spec["strategy"] == "embedding" and provider != "alphaxiv":
                    raise ValueError("Embedding discovery is available only on alphaXiv; explicitly select keyword mode for this source")
                found = provider_search(provider, spec, requests)
                hits.extend(found)
                limitations = []
                if provider == "crossref" and spec["priority"] != "default": limitations.append("Priority is applied in local candidate order; provider search remains bibliographic relevance")
                if provider == "arxiv" and (spec.get("published_after") or spec.get("published_before")): limitations.append("Date window is filtered on returned candidates; this may omit older matches beyond the bounded query")
                if provider == "biorxiv": limitations.append("Discovery uses OpenAlex bioRxiv source metadata; original version/abstract requires a separate bioRxiv read")
                statuses.append({"source": provider, "status": "received" if found else "empty", "count": len(found), "strategy": spec["strategy"], "limitations": limitations})
                tokens = re.findall(r"(?<!\w)[A-Za-z][A-Za-z0-9-]{1,9}(?!\w)", spec["query"])
                abbreviations = [token for token in tokens if sum(character.isupper() for character in token) >= 2]
                if provider == "alphaxiv" and spec["strategy"] == "keyword" and spec["round"] == 0 and abbreviations and " ".join(abbreviations) != spec["query"]:
                    recovery = {**spec, "query": " ".join(abbreviations)}
                    hits.extend(provider_search(provider, recovery, requests))
            except Exception as error:
                statuses.append({"source": provider, "status": "failed", "error": str(error)})
        merged = {}
        for hit in hits:
            key = ("doi:" + hit["doi"] if hit.get("doi") else "arxiv:" + hit["arxiv_id"] if hit.get("arxiv_id") else hit["source"] + ":" + hit["provider_id"])
            if hit.get("arxiv_id") and re.search(r"v\d+$", hit["arxiv_id"]): key += ":" + hit["arxiv_id"].rsplit("v", 1)[-1]
            if key not in merged:
                merged[key] = {**hit, "duplicates": [], "selection": "unselected", "reason": ""}
            else:
                merged[key]["duplicates"].append({"source": hit["source"], "provider_id": hit["provider_id"], "version": hit.get("version", "unknown")})
                if not merged[key].get("abstract") and hit.get("abstract"):
                    merged[key]["abstract"] = hit["abstract"]
        terms = set(re.findall(r"\w+", spec["query"].casefold()))
        def ranking(hit):
            relevance = -len(terms.intersection(re.findall(r"\w+", hit["title"].casefold())))
            publication = str(hit.get("publication_date") or "")
            known_date = bool(re.fullmatch(r"\d{4}(?:-\d{2})?(?:-\d{2})?", publication))
            if spec["priority"] == "historical": return (not known_date, publication if known_date else "", relevance)
            if spec["priority"] == "recency": return (known_date, publication if known_date else "", -relevance)
            if spec["priority"] == "popular": return (common.number(hit.get("citations") or 0, "citation count"), -relevance)
            return (relevance,)
        ordered = sorted(merged.values(), key=ranking, reverse=spec["priority"] in ("recency", "popular"))
        for index, hit in enumerate(ordered, 1): hit["candidate_id"] = "C" + str(index)
        by_title = {}
        for hit in ordered:
            key = re.sub(r"[^\w]+", "", hit["title"].casefold())
            hit["possible_title_duplicates"] = list(by_title.get(key, [])) if len(key) >= 20 else []
            by_title.setdefault(key, []).append(hit["candidate_id"])
        research.write_json(out / "query-spec.json", spec)
        research.write_json(out / "candidates.json", ordered)
        fields = ["candidate_id", "source", "provider_id", "doi", "title", "authors", "year", "publication_date", "content_level", "version", "url", "selection", "reason"]
        research.write_csv(out / "candidates.csv", [{key: hit.get(key, "") for key in fields} for hit in ordered], fields)
        research.write_json(out / "source-status.json", statuses)
        research.write_json(out / "reading-plan.json", {"ranked_candidate_ids": [hit["candidate_id"] for hit in ordered[:15]], "actual_candidates": len(ordered), "purpose": spec.get("purpose", "discovery"), "deep_read": "Select actual load-bearing 3–5 papers only when synthesis is requested; no metadata/full-text equivalence", "scientific_check": "pending"})
        return {"status": "partial" if any(item["status"] == "failed" for item in statuses) or not ordered else "complete", "candidate_count": len(ordered), "requests": requests.count}
    return common.step(ws, "literature", args.id, {"previous": args.previous, "spec": spec}, inputs, [previous] if previous else [], run, entry=__file__)


def read_paper(ws, args):
    search_record = common.extension_record(ws, "literature", args.search)
    specpath = ws.input(args.spec, {".json"})
    spec = common.strict_json(specpath)
    if not isinstance(spec, dict) or set(spec) - {"mode", "pmcid", "version"}: raise ValueError("Unknown reading specification fields")
    candidates = common.strict_json(search_record / "candidates.json")
    chosen = next((item for item in candidates if item["candidate_id"] == args.candidate), None)
    if chosen is None: raise ValueError("Candidate must come from a successful current-task discovery record")
    mode = spec.get("mode", "record")
    if mode not in ("record", "full_text", "pdf", "pmc"): raise ValueError("Unknown reading mode")
    def run(out):
        current = next(item for item in common.strict_json(search_record / "candidates.json") if item["candidate_id"] == args.candidate)
        provider, identifier = current["source"], current["provider_id"]
        requests = Requests(out, 4)
        content, level, filename, assurance = "", "metadata", "content.md", "provider-record"
        if mode == "pmc":
            pmcid = spec.get("pmcid", "")
            if not re.fullmatch(r"PMC[1-9]\d*", pmcid): raise ValueError("PMC reading requires a selected exact PMCID")
            raw, _ = requests.get("https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi", {"id": pmcid})
            oa = xml(raw)
            record = oa.find(".//record")
            if record is None or record.attrib.get("id") != pmcid: raise ValueError("PMC record is not in the OA service")
            raw, _ = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi", {"db": "pmc", "id": pmcid.removeprefix("PMC"), "retmode": "xml", "tool": "YanZhouResearch"})
            article = xml(raw)
            actual_doi = next((text(item).lower() for item in article.findall(".//article-id") if item.attrib.get("pub-id-type") == "doi"), "")
            actual_pmid = next((text(item) for item in article.findall(".//article-id") if item.attrib.get("pub-id-type") == "pmid"), "")
            if not current.get("doi") and provider != "pubmed": raise ValueError("PMC reading needs a matching selected DOI or PubMed identity")
            if current.get("doi") and actual_doi != current["doi"] or provider == "pubmed" and actual_pmid != identifier: raise ValueError("PMC article identity does not match selected candidate")
            (out / "article.xml").write_bytes(raw)
            content = "\n\n".join(text(item) for item in article.findall(".//article-title") + article.findall(".//abstract") + article.findall(".//body//p") + article.findall(".//table-wrap"))
            if not content.strip(): raise ValueError("PMC article has no readable full text")
            level = "full_text"; current["license"] = record.attrib.get("license", "unknown"); current["resolved_id"] = pmcid
        elif mode == "pdf":
            version = str(spec.get("version", ""))
            if provider in ("alphaxiv", "arxiv"):
                base = current.get("arxiv_id") or identifier
                base = re.sub(r"v\d+$", "", base)
                if not ARXIV.fullmatch(base) or not re.fullmatch(r"[1-9]\d*", version): raise ValueError("Original arXiv PDF requires an exact version")
                url = "https://arxiv.org/pdf/" + base + "v" + version
            elif provider == "biorxiv":
                if not DOI.fullmatch(identifier) or not re.fullmatch(r"[1-9]\d*", version): raise ValueError("bioRxiv PDF requires exact DOI/version")
                url = "https://www.biorxiv.org/content/" + identifier + "v" + version + ".full.pdf"
            else:
                raise ValueError("This provider has no verified original PDF route; import a selected legal PDF")
            raw, content_type = requests.get(url)
            if not raw.startswith(b"%PDF-"): raise ValueError("Provider did not return PDF bytes")
            filename = "original.pdf"; (out / filename).write_bytes(raw)
            assurance = "requested-address-unverified"; level = "full_text"; current["resolved_id"] = base + "v" + version if provider != "biorxiv" else identifier + "v" + version
            current["discovery_version"] = current.get("version", "unknown")
            current["version"] = version
            current["retrieval_url"] = url
            current["url"] = ("https://www.biorxiv.org/content/" if provider == "biorxiv" else "https://www.alphaxiv.org/abs/" if provider == "alphaxiv" else "https://arxiv.org/abs/") + current["resolved_id"]
        elif mode == "full_text":
            if provider != "alphaxiv": raise ValueError("Use PMC full text, exact original PDF or an explicitly imported original")
            if not ARXIV.fullmatch(identifier): raise ValueError("Invalid alphaXiv paper ID")
            raw, content_type = requests.get("https://www.alphaxiv.org/abs/" + identifier + ".md")
            content = raw.decode("utf-8")
            if "text/html" in content_type.lower() or re.match(r"\s*(?:<!doctype\s+html|<html)", content, re.I) or not content.strip(): raise ValueError("No original Markdown text; generated overview is not original evidence")
            level = "full_text"; assurance = "requested-address-unverified"
        else:
            if provider == "pubmed":
                raw, _ = requests.get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi", {"db": "pubmed", "id": identifier, "retmode": "xml", "tool": "YanZhouResearch"})
                actual = next((item for item in pubmed_hits(raw) if item["provider_id"] == identifier), None)
                if actual is None: raise ValueError("PubMed returned a different paper")
                current.update(actual); content = actual["abstract"] or json.dumps(actual, ensure_ascii=False); level = actual["content_level"]
            elif provider == "biorxiv":
                raw, _ = requests.get("https://api.biorxiv.org/details/biorxiv/" + identifier + "/na/json")
                records = [item for item in common.strict_json(raw).get("collection", []) if str(item.get("doi", "")).lower() == identifier]
                if not records: raise ValueError("bioRxiv returned no matching DOI")
                actual = max(records, key=lambda item: int(item["version"]))
                content = actual.get("abstract") or json.dumps(actual, ensure_ascii=False); level = "abstract" if actual.get("abstract") else "metadata"
                current.update(version=str(actual["version"]), license=actual.get("license") or "unknown")
            else:
                content = current.get("abstract") or json.dumps(current, ensure_ascii=False, indent=2); level = "abstract" if current.get("abstract") else "metadata"
        if filename != "original.pdf": (out / filename).write_text(content, encoding="utf-8")
        paper = {**current, "content_level": level, "requested_id": identifier, "source_file": filename, "source_sha256": research.digest(out / filename), "version_assurance": assurance, "page_mapping": "requires rendering" if filename == "original.pdf" else "unavailable", "actual_reading": "not_recorded", "limitations": ["Retrieved content does not prove it was read", "Metadata/abstract cannot prove full-text claims", "PDF bibliographic fields come from discovery; check the exact retrieved version headers before citation"]}
        research.write_json(out / "paper.json", paper)
        return {"content_level": level, "actual_reading": "not_recorded"}
    return common.step(ws, "readings", args.id, {"search": args.search, "candidate": args.candidate, "spec": spec}, [specpath, search_record / "receipt.json"], [search_record], run, entry=__file__)


def register_local(ws, args):
    file = ws.input(args.file, {".pdf", ".txt", ".md", ".csv", ".json"})
    metadata = ws.input(args.metadata, {".json"})
    def run(out):
        item = common.strict_json(metadata)
        required = ("title", "authors", "year", "content_level", "selection_reason", "license")
        if any(not isinstance(item.get(key), str) for key in required) or not item["selection_reason"].strip() or not item["title"].strip(): raise ValueError("Source metadata needs explicit identity, level, selection reason and license status")
        if item["content_level"] not in ("metadata", "abstract", "full_text", "data"): raise ValueError("Unknown source content level")
        if file.suffix.lower() == ".json": common.strict_json(file)
        research.write_json(out / "source.json", {**item, "source_id": args.id, "file": common.relative(ws, file), "sha256": research.digest(file), "selected": True, "retrieved_at": research.now()})
        return {}
    return common.step(ws, "sources", args.id, {}, [file, metadata], [], run, entry=__file__)


def select_reading(ws, args):
    reading = common.extension_record(ws, "readings", args.reading)
    specpath = ws.input(args.spec, {".json"})
    def run(out):
        spec = common.strict_json(specpath)
        if not isinstance(spec, dict) or set(spec) != {"selection_reason"}: raise ValueError("Selection specification only accepts its reason")
        if not isinstance(spec.get("selection_reason"), str) or not spec["selection_reason"].strip(): raise ValueError("Selection requires an explicit task-specific reason")
        paper = common.strict_json(reading / "paper.json")
        file = ws.task_path((reading / paper["source_file"]).relative_to(ws.root), exists=True)
        if research.digest(file) != paper["source_sha256"]: raise ValueError("Reading source changed")
        target = out / ("original.pdf" if file.suffix == ".pdf" else "original.md")
        target.write_bytes(file.read_bytes())
        final = ws.task / "sources" / research.identifier(args.id) / target.name
        research.write_json(out / "source.json", {"title": str(paper["title"]), "authors": str(paper.get("authors") or "unknown"), "year": str(paper.get("year") or "unknown"),
                            "content_level": paper["content_level"], "selection_reason": spec["selection_reason"], "license": str(paper.get("license") or "unknown"), "doi": paper.get("doi", ""), "url": paper.get("url", ""),
                            "source_id": args.id, "file": common.relative(ws, final), "sha256": research.digest(target), "retrieved_at": research.now(), "selected": True, "reading_id": args.reading,
                            "version": paper.get("version", "unknown"), "discovery_version": paper.get("discovery_version", "unknown"), "version_assurance": paper["version_assurance"],
                            "requested_id": paper["requested_id"], "resolved_id": paper.get("resolved_id", paper["requested_id"]), "retrieval_url": paper.get("retrieval_url", ""), "limitations": paper["limitations"]})
        return {}
    return common.step(ws, "sources", args.id, {"reading": args.reading}, [specpath, reading / "receipt.json"], [reading], run, entry=__file__)


def parser():
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--workspace", required=True); result.add_argument("--task", default="T1")
    sub = result.add_subparsers(dest="command", required=True)
    search_parser = sub.add_parser("search"); search_parser.add_argument("--id", required=True); search_parser.add_argument("--spec", required=True); search_parser.add_argument("--previous")
    read_parser = sub.add_parser("read"); read_parser.add_argument("--id", required=True); read_parser.add_argument("--search", required=True); read_parser.add_argument("--candidate", required=True); read_parser.add_argument("--spec", required=True)
    register_parser = sub.add_parser("register"); register_parser.add_argument("--id", required=True); register_parser.add_argument("--file", required=True); register_parser.add_argument("--metadata", required=True)
    select_parser = sub.add_parser("select"); select_parser.add_argument("--id", required=True); select_parser.add_argument("--reading", required=True); select_parser.add_argument("--spec", required=True)
    return result


def main(argv=None):
    methods = {"search": search, "read": read_paper, "register": register_local, "select": select_reading}
    return common.cli(lambda ws, args: methods[args.command](ws, args), parser(), argv)


if __name__ == "__main__":
    raise SystemExit(main())
