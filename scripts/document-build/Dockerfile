FROM python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
COPY debs/ /debs/
COPY debian-packages.lock.json /opt/pi-document-build/debian-packages.lock.json
RUN python -c "import json,hashlib,pathlib; d=pathlib.Path('/debs'); lock=json.load(open('/opt/pi-document-build/debian-packages.lock.json')); assert {p.name for p in d.iterdir()} == {p['file'] for p in lock['packages']}; [(lambda b,p: (_ for _ in ()).throw(ValueError(p['file'])) if len(b)!=p['bytes'] or hashlib.sha256(b).hexdigest()!=p['sha256'] else None)((d/p['file']).read_bytes(),p) for p in lock['packages']]" \
 && apt-get -o Dir::Cache::archives=/debs --no-download --no-install-recommends -y install /debs/*.deb \
 && rm -rf /debs /var/lib/apt/lists/* \
 && dpkg-query -W > /opt/pi-document-build/installed-packages.txt \
 && mkdir -p /opt/pi-document-build/tex-cache \
 && TEXMFCACHE=/opt/pi-document-build/tex-cache luaotfload-tool --update --force \
 && chmod -R a+rX /opt/pi-document-build/tex-cache
COPY build.py /opt/pi-document-build/build.py
ARG LOCK_DIGEST
ARG SCRIPT_DIGEST
ARG DOCKERFILE_DIGEST
ARG PROFILE_DIGEST
LABEL pi-research.compiler-profile="latex-document-v1" pi-research.compiler-lock="${LOCK_DIGEST}" pi-research.compiler-script="${SCRIPT_DIGEST}" pi-research.compiler-dockerfile="${DOCKERFILE_DIGEST}" pi-research.compiler-digest="${PROFILE_DIGEST}"
RUN pdflatex --version && xelatex --version && lualatex --version && bibtex --version && biber --version && pdfinfo -v && pdftoppm -v
USER 65532:65532
ENV PYTHONDONTWRITEBYTECODE=1
ENTRYPOINT ["python", "-I", "/opt/pi-document-build/build.py"]
