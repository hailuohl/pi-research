# Fixed PDF parser profile

Run `node scripts/setup-document-parser.mjs desktop-linux` on the current Windows/Linux-amd64 Docker setup. The script downloads only the two wheel URLs embedded in the setup script, verifies SHA-256, then builds with network disabled. It writes the immutable local image digest and profile hashes to `.validation/parser-builds/latest.json`; configure that digest explicitly in the application. No PDF is parsed on the host.

The fixed profile uses pypdfium2 5.13.0 and Pillow 11.3.0. The image build verifies that PDFium has no V8/XFA feature flags. The program does not initialize forms, open document scripts or extract attachments. It extracts physical pages using `get_text_bounded` (full Unicode), saves exact UTF-8 page text, derives UTF-16 paragraph offsets heuristically, and renders bounded PNG previews. It performs no OCR and does not claim verified reading order, table/figure extraction or scientific correctness.

Limits: 100 physical pages, image edge ≤1600, text ≤8 MiB, outputs ≤128 MiB, 1 CPU, 512 MiB, 180 seconds. Failed or recovered/incomplete execution does not publish a usable parse result. Source bytes stay in their immutable DocumentVersion.

Upstream license and third-party notice files remain in the installed wheel directories, including `pypdfium2-5.13.0.dist-info/licenses/LICENSES`, its `data/linux_x64/BUILD_LICENSES`, and `pillow-11.3.0.dist-info/licenses/LICENSE`.

Primary references: https://pypi.org/project/pypdfium2/5.13.0/ ; https://pypi.org/project/Pillow/11.3.0/ ; https://pypdfium2.readthedocs.io/en/stable/python_api.html . Wheel hashes are recorded in `requirements.lock`; wheel binaries and built images are not repository artifacts.
