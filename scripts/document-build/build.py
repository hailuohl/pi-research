"""Fixed, offline TeX supervisor. Manuscripts never supply executable arguments."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import selectors
import signal
import stat
import struct
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

PROFILE = 'latex-document-v1'
MAX_LOG = 1024 * 1024
MAX_OUTPUT = 128 * 1024 * 1024
MAX_PASSES = 6
TIMEOUT = 120
SOURCE = Path('/work/source')
BUILD = Path('/work/build')
ENGINES = {'pdflatex', 'xelatex', 'lualatex'}
BIBLIOGRAPHIES = {'auto', 'none', 'bibtex', 'biber'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def relative_file(value):
    p = PurePosixPath(value)
    if not value or '\\' in value or any(ord(c) < 32 for c in value) or p.is_absolute() or any(x in ('', '.', '..') for x in value.split('/')) or value.startswith('-'):
        raise ValueError('Invalid relative input path')
    return p


def ordinary(path, maximum=MAX_OUTPUT):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_size > maximum:
            raise ValueError('Invalid or oversized output file')
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            data = stream.read(maximum + 1)
        if len(data) > maximum:
            raise ValueError('Output exceeds limit')
        return data
    finally:
        os.close(fd)


def within_source(value, suffix=None):
    p = relative_file(value)
    path = SOURCE.joinpath(*p.parts)
    if suffix and not path.suffix:
        path = path.with_suffix(suffix)
    resolved = path.resolve(strict=True)
    if not resolved.is_relative_to(SOURCE.resolve()) or any(part.is_symlink() for part in [path, *path.parents] if part != SOURCE.parent):
        raise ValueError('Input escapes manuscript directory')
    ordinary(path)
    return path


def bibliographic_inputs(stem, backend):
    if backend == 'biber':
        data = ordinary(BUILD / (stem + '.bcf'), 8 * 1024 * 1024).decode('utf-8-sig')
        if re.search(r'<!\s*(?:DOCTYPE|ENTITY)', data, re.I):
            raise ValueError('External XML declarations are prohibited')
        tree = ET.fromstring(data)
        for node in tree.iter():
            if node.tag.rsplit('}', 1)[-1] == 'datasource':
                value = (node.text or '').strip()
                if node.get('type', 'file') != 'file' or node.get('datatype', 'bibtex') != 'bibtex' or re.match(r'^[A-Za-z][A-Za-z0-9+.-]*:', value) or any(c in value for c in '*?[]'):
                    raise ValueError('Only explicit local BibTeX data sources are permitted')
                within_source(value, '.bib')
    else:
        for aux in BUILD.rglob('*.aux'):
            text = ordinary(aux, 8 * 1024 * 1024).decode('utf8', 'replace')
            for value in re.findall(r'\\bibdata\{([^}]*)\}', text):
                for name in value.split(','):
                    within_source(name.strip(), '.bib')
            for name in re.findall(r'\\@input\{([^}]*)\}', text):
                relative_file(name)
                path = BUILD / name
                if not path.resolve().is_relative_to(BUILD):
                    raise ValueError('Auxiliary input escapes build directory')
                ordinary(path, 8 * 1024 * 1024)
            for value in re.findall(r'\\bibstyle\{([^}]*)\}', text):
                relative_file(value)


class Build:
    def __init__(self, engine, main, bibliography, source_digest, output):
        self.engine, self.main, self.bibliography, self.source_digest = engine, main, bibliography, source_digest
        self.output = Path(output)
        self.deadline = time.monotonic() + TIMEOUT
        self.log = bytearray()
        self.diagnostics = []
        self.had_errors = False
        self.passes = 0
        self.converged = False
        self.engine_version = ''
        self.env = {'PATH': '/usr/local/bin:/usr/bin:/bin', 'HOME': '/tmp', 'LANG': 'C.UTF-8', 'LC_ALL': 'C.UTF-8', 'TMPDIR': '/tmp',
                    'openin_any': 'p', 'openout_any': 'p', 'shell_escape': 'f', 'TEXMFHOME': '/nonexistent',
                    'TEXMFCONFIG': '/nonexistent', 'TEXMFVAR': str(BUILD / 'tex-cache'), 'TEXMFCACHE': str(BUILD / 'tex-cache') + ':/opt/pi-document-build/tex-cache',
                    'TEXMFOUTPUT': str(BUILD), 'BIBINPUTS': str(SOURCE) + ':', 'BSTINPUTS': str(SOURCE) + ':',
                    'SOURCE_DATE_EPOCH': '1727481600', 'FORCE_SOURCE_DATE': '1', 'max_print_line': '1000'}
        # Lua's font loader reads absolute distribution paths. Container mounts,
        # not openin_any, are the read boundary; openout_any still limits writes.
        if engine == 'lualatex':
            self.env['openin_any'] = 'a'

    def diagnostic(self, code, message, severity='error', file=None, line=None, pass_number=None):
        if severity == 'error':
            self.had_errors = True
        value = {'severity': severity, 'code': code, 'message': message[:2000], 'file': file, 'line': line, 'pass': pass_number}
        if len(self.diagnostics) < 500 and value not in self.diagnostics:
            self.diagnostics.append(value)

    def run(self, argv, cwd=SOURCE):
        remaining = self.deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError('Total compiler deadline exceeded')
        prefix = ('\n$ ' + ' '.join(argv) + '\n').encode()
        if len(self.log) + len(prefix) > MAX_LOG:
            raise ValueError('Compiler log exceeds 1 MiB')
        self.log.extend(prefix)
        child = subprocess.Popen(argv, cwd=cwd, env=self.env, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
        captured = bytearray()
        try:
            with selectors.DefaultSelector() as selector:
                selector.register(child.stdout, selectors.EVENT_READ)
                while selector.get_map():
                    if time.monotonic() >= self.deadline:
                        raise TimeoutError('Total compiler deadline exceeded')
                    for key, _ in selector.select(min(0.1, self.deadline - time.monotonic())):
                        chunk = os.read(key.fd, 65536)
                        if not chunk:
                            selector.unregister(key.fileobj)
                            break
                        remaining = MAX_LOG - len(self.log)
                        self.log.extend(chunk[:remaining])
                        captured.extend(chunk[:remaining])
                        if len(chunk) > remaining:
                            raise ValueError('Compiler log exceeds 1 MiB')
                code = child.wait(timeout=max(0.01, self.deadline - time.monotonic()))
        finally:
            # Always retire the entire group before trusting or publishing output.
            try:
                os.killpg(child.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            child.wait()
            child.stdout.close()
        return code, captured.decode('utf8', 'replace')

    def parse_diagnostics(self, text):
        def error_code(message):
            missing = re.search(r'\bFile\s+(.+?)\s+not found\b', message, re.I)
            if missing:
                suffix = PurePosixPath(missing[1].strip('`\'" ')).suffix.lower()
                if suffix in {'.sty', '.cls'}:
                    return 'missing_package'
                if suffix in {'.png', '.jpg', '.jpeg', '.pdf', '.eps', '.svg', '.bmp', '.tif', '.tiff'}:
                    return 'missing_image'
                if suffix in {'.tfm', '.map', '.pfb', '.otf', '.ttf'}:
                    return 'missing_font'
                return 'tex_error'
            if re.search(r'(?:\bfont\s+.+not loadable\b|\bthe font\s+.+cannot be found\b|\bMetric\s+\(TFM\)\s+file not found\b|\.(?:tfm|map|pfb|otf|ttf)(?=[\x27`"\s):]).*(?:not found|cannot open|can.t open))', message, re.I):
                return 'missing_font'
            if re.search(r'Unable to load picture|Cannot determine size of graphic', message, re.I):
                return 'missing_image'
            return 'tex_error'

        found = False
        for match in re.finditer(r'(?m)^([^\n]+\.(?:tex|sty|cls|bib)):(\d+):\s*(.+)$', text):
            file, line, message = match.groups()
            file = file.removeprefix(str(SOURCE) + '/').removeprefix('./')
            try:
                within_source(file)
            except (ValueError, OSError):
                file = None
            code = error_code(message)
            if file is None:
                message += ' [compiler dependency location; not a manuscript source line]'
            self.diagnostic(code, message, file=file, line=int(line), pass_number=self.passes)
            found = True
        for match in re.finditer(r'(?m)^!\s*(.+)', text):
            tail = text[match.end():match.end()+3000]
            line = re.search(r'(?m)^l\.(\d+)\b', tail)
            self.diagnostic(error_code(match.group(1)), match.group(1), line=int(line[1]) if line else None, pass_number=self.passes)
            found = True
        if re.search(r'(?m)^Missing character:', text):
            self.diagnostic('missing_character', 'The selected font is missing one or more characters.', pass_number=self.passes)
        if re.search(r'(?im)(?:runsystem\([^\n]*\)\.\.\.disabled|shell escape.*not allowed|disabled.*shell escape)', text):
            self.diagnostic('shell_disabled', 'Shell escape request was disabled.', 'warning', pass_number=self.passes)
        return found

    def state(self):
        # ponytail: standard reference files only; add package-specific suffixes with a supported template.
        suffixes = {'.aux', '.toc', '.lof', '.lot', '.out', '.bcf', '.bbl', '.nav', '.snm'}
        return {str(path.relative_to(BUILD)): sha(ordinary(path, 8 * 1024 * 1024)) for path in sorted(BUILD.rglob('*')) if path.suffix in suffixes}

    def compile(self):
        code, version = self.run([self.engine, '--version'])
        self.engine_version = version.splitlines()[0] if version else ''
        if code:
            raise ValueError('Cannot identify TeX engine')
        stem = 'document'
        flags = ['-no-shell-escape', '-interaction=nonstopmode', '-halt-on-error', '-file-line-error', '-recorder', '-jobname=' + stem, '-output-directory=' + str(BUILD)]
        if self.engine == 'lualatex':
            # luaotfload rejects --safer. LuaHBTeX's no-shell-escape disables
            # execute/spawn/exec/popen/C loading/ffi and strips debug to traceback.
            flags += ['--nosocket']
        else:
            flags += ['-no-parse-first-line']
        previous, bib_state = None, None
        for number in range(1, MAX_PASSES + 1):
            self.passes = number
            code, text = self.run([self.engine, *flags, './' + self.main])
            found = self.parse_diagnostics(text)
            if code or self.had_errors:
                if code and not found:
                    self.diagnostic('engine_exit', f'{self.engine} exited with status {code}.', pass_number=number)
                return 'failed', stem
            bcf, aux = BUILD / (stem + '.bcf'), BUILD / (stem + '.aux')
            backend = self.bibliography
            if backend == 'auto':
                backend = 'biber' if bcf.exists() else 'bibtex' if aux.exists() and b'\\bibdata{' in ordinary(aux, 8 * 1024 * 1024) else 'none'
            current = self.state()
            needed = {name: value for name, value in current.items() if name.endswith('.bcf' if backend == 'biber' else '.aux')}
            if backend != 'none' and needed and needed != bib_state:
                bibliographic_inputs(stem, backend)
                command = ['biber', '--noconf', '--input-directory=' + str(SOURCE), '--output-directory=' + str(BUILD), str(BUILD / stem)] if backend == 'biber' else ['bibtex', stem]
                bib_code, bib_text = self.run(command, cwd=BUILD)
                if bib_code or re.search(r'(?m)(?:^ERROR -|^FATAL -|^I couldn.t open|^I found no)', bib_text):
                    self.diagnostic('bibliography_error', bib_text[-2000:] or f'{backend} exited {bib_code}.', pass_number=number)
                    return 'failed', stem
                bib_state = needed
                previous = current
                continue
            unresolved = bool(re.search(r'(?i)(?:There were undefined references|There were undefined citations|Citation .+ undefined|Reference .+ undefined|Rerun to get|Label\(s\) may have changed|Please \(re\)run|Please rerun|rerunfilecheck Warning)', text))
            if current == previous and not unresolved:
                self.converged = True
                return 'succeeded', stem
            previous = current
        self.diagnostic('non_convergent', f'References did not stabilize within {MAX_PASSES} TeX passes.', pass_number=self.passes)
        return 'non_convergent', stem

    def artifacts(self, stem):
        pdf_path = BUILD / (stem + '.pdf')
        pdf = ordinary(pdf_path, 32 * 1024 * 1024)
        if not pdf.startswith(b'%PDF-'):
            raise ValueError('Compiler did not produce a PDF')
        code, info = self.run(['pdfinfo', str(pdf_path)])
        match = re.search(r'(?m)^Pages:\s*(\d+)\s*$', info)
        if code or not match or not 1 <= int(match[1]) <= 100:
            raise ValueError('Invalid PDF or PDF exceeds 100 pages')
        pages = int(match[1])
        files = {'document.pdf': pdf}
        previews = []
        for page in range(1, pages + 1):
            prefix = BUILD / f'pi-preview-{page:03d}'
            code, text = self.run(['pdftoppm', '-f', str(page), '-l', str(page), '-singlefile', '-scale-to', '1600', '-png', str(pdf_path), str(prefix)])
            if code:
                raise ValueError('PDF page rendering failed: ' + text[-500:])
            data = ordinary(str(prefix) + '.png', 16 * 1024 * 1024)
            if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
                raise ValueError('Invalid rendered PNG')
            width, height = struct.unpack('>II', data[16:24])
            if not (1 <= width <= 1600 and 1 <= height <= 1600):
                raise ValueError('Page preview dimensions exceed limit')
            name = f'page-{page:03d}.png'
            files[name] = data
            if sum(map(len, files.values())) + len(self.log) > MAX_OUTPUT:
                raise ValueError('Build output exceeds 128 MiB')
            previews.append({'pageNumber': page, 'file': name, 'digest': sha(data), 'bytes': len(data), 'width': width, 'height': height})
        return files, {'file': 'document.pdf', 'digest': sha(pdf), 'bytes': len(pdf), 'pages': pages}, previews

    def publish(self, status, files, pdf, previews):
        # Discard files written by a manuscript. Only supervisor-owned bytes are exported.
        for path in self.output.iterdir():
            if path.is_symlink() or not path.is_file():
                raise ValueError('Unexpected non-regular output entry')
            path.unlink()
        log = bytes(self.log)
        files['build.log'] = log
        result = {'formatVersion': 1, 'profileId': PROFILE, 'sourceDigest': self.source_digest, 'engine': self.engine,
                  'bibliography': self.bibliography, 'engineVersion': self.engine_version, 'status': status,
                  'hadErrors': self.had_errors, 'converged': self.converged, 'passes': self.passes,
                  'diagnostics': self.diagnostics, 'pdf': pdf, 'previews': previews,
                  'logs': [{'file': 'build.log', 'digest': sha(log), 'bytes': len(log)}]}
        files['build.json'] = (json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
        if sum(map(len, files.values())) > MAX_OUTPUT:
            raise ValueError('Build output exceeds limit')
        for name, data in files.items():
            temporary = self.output / (name + '.partial')
            fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o644)
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
            os.replace(temporary, self.output / name)
        return 0 if status == 'succeeded' and not self.had_errors and self.converged and pdf else 1

    def execute(self):
        files, pdf, previews = {}, None, []
        try:
            BUILD.mkdir(mode=0o700)
            within_source(self.main)
            # Prevent shipped auxiliaries/PDF from masquerading as compiler output.
            forbidden = {'.aux', '.bbl', '.bcf', '.blg', '.log', '.fls', '.toc', '.out', '.lof', '.lot'}
            for path in SOURCE.rglob('*'):
                if path.is_symlink() or not (path.is_dir() or path.is_file()):
                    raise ValueError('Manuscript contains a non-regular entry')
                if path.is_dir():
                    (BUILD / path.relative_to(SOURCE)).mkdir(parents=True, exist_ok=True)
                if path.is_file() and (path.suffix in forbidden or path.name.startswith(('pi-document.', 'pi-preview-'))):
                    raise ValueError('Manuscript contains reserved compiler output')
            status, stem = self.compile()
            if status == 'succeeded':
                files, pdf, previews = self.artifacts(stem)
        except (TimeoutError, subprocess.TimeoutExpired):
            status = 'timed_out'
            self.diagnostic('timeout', 'Total compiler deadline exceeded.', pass_number=self.passes or None)
        except Exception as error:
            status = 'failed'
            self.diagnostic('build_error', str(error), pass_number=self.passes or None)
        return self.publish(status, files, pdf, previews)


def main():
    if len(sys.argv) != 6:
        raise ValueError('Expected engine mainFile bibliography sourceDigest outputDirectory')
    engine, source, bibliography, source_digest, output = sys.argv[1:]
    if engine not in ENGINES or bibliography not in BIBLIOGRAPHIES or not re.fullmatch('[a-f0-9]{64}', source_digest) or output != '/output':
        raise ValueError('Invalid compiler arguments')
    relative_file(source)
    if not source.endswith('.tex'):
        raise ValueError('Main file must be TeX')
    return Build(engine, source, bibliography, source_digest, output).execute()


if __name__ == '__main__':
    sys.exit(main())
