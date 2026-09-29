"""Fixed isolated PDF text/page renderer. No forms, JavaScript, attachments or OCR."""
import hashlib
import json
import math
import re
import sys
from pathlib import Path
from contextlib import closing
from array import array

PROFILE = "pdfium-text-images-v2"
QUALITY = {"readingOrder": "unverified", "paragraphs": "heuristic", "tables": "unknown", "figures": "unknown", "ocr": False, "score": None}

def paragraphs(text):
    # Offsets are UTF-16 code units into the exact saved page text (including CRLF).
    offsets = array("I", [0])
    for character in text:
        offsets.append(offsets[-1] + len(character.encode("utf-16-le")) // 2)
    return [{"index": i + 1, "start": offsets[m.start()], "end": offsets[m.end()]} for i, m in enumerate(re.finditer(r"\S[^\r\n]*(?:\r?\n(?!\s*\r?\n)[^\r\n]+)*", text))]

def parse(source, destination):
    import pypdfium2 as pdfium
    if pdfium.PYPDFIUM_INFO.version != "5.13.0" or pdfium.PDFIUM_INFO.flags:
        raise ValueError("PARSER_PROFILE_MISMATCH")
    raw = source.read_bytes()
    if len(raw) > 32 * 1024 * 1024 or not raw.startswith(b"%PDF-"):
        raise ValueError("PDF_INPUT_INVALID")
    destination.mkdir(parents=True, exist_ok=True)
    output = {"formatVersion": 2, "profileId": PROFILE, "rawDigest": hashlib.sha256(raw).hexdigest(), "pageCount": 0, "quality": QUALITY, "pages": []}
    text_bytes = output_bytes = 0
    with pdfium.PdfDocument(raw) as document:
        if not 1 <= len(document) <= 100:
            raise ValueError("PDF_PAGE_LIMIT")
        output["pageCount"] = len(document)
        for number in range(1, len(document) + 1):
            with closing(document[number - 1]) as page:
                width, height = page.get_size()
                if not all(math.isfinite(x) and 0 < x <= 100000 for x in (width, height)):
                    raise ValueError("PDF_PAGE_GEOMETRY_INVALID")
                with closing(page.get_textpage()) as text_page:
                    text = text_page.get_text_bounded(errors="strict")
                encoded = text.encode("utf-8")
                text_bytes += len(encoded)
                if text_bytes > 8 * 1024 * 1024:
                    raise ValueError("PDF_TEXT_LIMIT")
                text_file, image_file = f"page-{number:04d}.txt", f"page-{number:04d}.png"
                (destination / text_file).write_bytes(encoded)
                with closing(page.render(scale=min(1.5, 1599 / max(width, height)))) as bitmap:
                    image = bitmap.to_pil()
                    try:
                        image.save(destination / image_file, format="PNG")
                        image_width, image_height = image.size
                    finally:
                        image.close()
                    coordinates = bitmap.get_posconv(page)
                    candidates = []
                    # Nested Form objects need ancestor transforms; keep this profile to direct page objects.
                    for object_number, item in enumerate(page.get_objects(filter=[pdfium.raw.FPDF_PAGEOBJ_IMAGE], max_depth=0)):
                        if object_number >= 100:
                            raise ValueError("PDF_IMAGE_LIMIT")
                        left, bottom, right, top = item.get_bounds()
                        if not all(math.isfinite(x) and abs(x) <= 1_000_000 for x in (left, bottom, right, top)) or right <= left or top <= bottom:
                            raise ValueError("PDF_IMAGE_GEOMETRY_INVALID")
                        corners = [coordinates.to_bitmap(x, y) for x in (left, right) for y in (bottom, top)]
                        x0, x1 = max(0, min(x for x, _ in corners)), min(image_width, max(x for x, _ in corners))
                        y0, y1 = max(0, min(y for _, y in corners)), min(image_height, max(y for _, y in corners))
                        if x1 <= x0 or y1 <= y0:
                            continue
                        candidates.append({"index": len(candidates) + 1, "method": "embedded-raster-object", "pixelBounds": {"left": x0, "top": y0, "right": x1, "bottom": y1}})
                image_bytes = (destination / image_file).read_bytes()
                output_bytes += len(encoded) + len(image_bytes)
                if output_bytes > 127 * 1024 * 1024:
                    raise ValueError("PDF_OUTPUT_LIMIT")
                label = document.get_page_label(number - 1) or None
                if label is not None and len(label) > 200:
                    raise ValueError("PDF_PAGE_LABEL_LIMIT")
                output["pages"].append({"pageNumber": number, "pageLabel": label, "width": width, "height": height, "imageWidth": image_width, "imageHeight": image_height, "textFile": text_file, "textDigest": hashlib.sha256(encoded).hexdigest(), "textBytes": len(encoded), "imageFile": image_file, "imageDigest": hashlib.sha256(image_bytes).hexdigest(), "imageBytes": len(image_bytes), "paragraphs": paragraphs(text), "textStatus": "text-extracted" if text.strip() else "no-text-layer", "imageCandidates": candidates})
    manifest = json.dumps(output, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(manifest) > 1024 * 1024:
        raise ValueError("PDF_STRUCTURE_LIMIT")
    (destination / "manifest.json").write_bytes(manifest)
    print(json.dumps({"profileId": PROFILE, "pageCount": output["pageCount"], "textBytes": text_bytes}), flush=True)

if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError("PARSER_ARGUMENT_INVALID")
        parse(Path(sys.argv[1]), Path(sys.argv[2]))
    except Exception as error:
        # No user-controlled text or filesystem paths in diagnostic output.
        code = str(error) if isinstance(error, ValueError) and re.fullmatch(r"[A-Z_]+", str(error)) else "PDF_PARSE_FAILED"
        print(code, file=sys.stderr, flush=True)
        raise SystemExit(1)
