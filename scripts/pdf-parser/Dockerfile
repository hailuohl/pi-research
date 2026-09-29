FROM python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
COPY wheels/ /wheels/
COPY requirements.lock /opt/pi-document/requirements.lock
RUN python -m pip install --no-index --no-deps --require-hashes --find-links=/wheels -r /opt/pi-document/requirements.lock && rm -rf /wheels
COPY parse.py /opt/pi-document/parse.py
ARG LOCK_DIGEST
ARG SCRIPT_DIGEST
ARG PROFILE_DIGEST
LABEL pi-research.parser-profile="pdfium-text-images-v2" pi-research.parser-lock="${LOCK_DIGEST}" pi-research.parser-script="${SCRIPT_DIGEST}" pi-research.parser-digest="${PROFILE_DIGEST}"
RUN python -c "import pypdfium2 as p; import PIL; assert p.PYPDFIUM_INFO.version == '5.13.0' and not p.PDFIUM_INFO.flags and PIL.__version__ == '11.3.0'"
# Upstream license/notice files remain installed with the wheel distributions.
USER 65532:65532
ENV PYTHONDONTWRITEBYTECODE=1
ENTRYPOINT ["python", "/opt/pi-document/parse.py"]
