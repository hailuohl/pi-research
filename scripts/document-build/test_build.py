"""Minimal, redacted compiler log regressions; importing never runs a build."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('document_build', Path(__file__).with_name('build.py'))
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class DiagnosticsTest(unittest.TestCase):
    def parse(self, text):
        compiler = build.Build('xelatex', 'main.tex', 'none', 'a' * 64, '/output')
        compiler.passes = 1
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory)
            (source / 'main.tex').write_text('test source', encoding='utf8')
            with patch.object(build, 'SOURCE', source):
                self.assertTrue(compiler.parse_diagnostics(text))
        return compiler.diagnostics

    def test_bang_ctex_missing_is_package_without_guessing_source(self):
        diagnostics = self.parse("! LaTeX Error: File `ctex.sty' not found.\n\nl.3 \\usepackage{hyperref}\n")
        self.assertEqual(diagnostics[0]['code'], 'missing_package')
        self.assertIsNone(diagnostics[0]['file'])

    def test_library_metric_error_is_font_and_never_main_line_4887(self):
        diagnostics = self.parse('/usr/share/texlive/texmf-dist/tex/latex/hyperref/hyperref.sty:4887: Font \\U/pzd/m/n/10=pzdr at 10.0pt not loadable: Metric (TFM) file not found.\nl.4887 \\font\\test=pzdr\n')
        self.assertEqual(diagnostics[0]['code'], 'missing_font')
        self.assertIsNone(diagnostics[0]['file'])
        self.assertIn('dependency', diagnostics[0]['message'])

    def test_actual_missing_picture_keeps_relative_source_location(self):
        diagnostics = self.parse("./main.tex:4: LaTeX Error: File `missing-image.png' not found.\n")
        self.assertEqual(diagnostics[0]['code'], 'missing_image')
        self.assertEqual((diagnostics[0]['file'], diagnostics[0]['line']), ('main.tex', 4))

    def test_unknown_file_is_not_assumed_to_be_picture(self):
        self.assertEqual(self.parse("./main.tex:4: File `missing-data.csv' not found.\n")[0]['code'], 'tex_error')

    def test_picture_name_containing_font_is_still_a_missing_picture(self):
        diagnostics = self.parse("./main.tex:4: LaTeX Error: File `font-plot.png' not found.\n")
        self.assertEqual(diagnostics[0]['code'], 'missing_image')
        self.assertEqual((diagnostics[0]['file'], diagnostics[0]['line']), ('main.tex', 4))

    def test_package_name_containing_font_is_still_a_missing_package(self):
        diagnostics = self.parse("! LaTeX Error: File `fontawesome5.sty' not found.\nl.3 \\begin{document}\n")
        self.assertEqual(diagnostics[0]['code'], 'missing_package')

    def test_font_and_map_failures_take_precedence_over_generic_file_errors(self):
        for message in ["Package fontspec Error: The font `Absent' cannot be found.", "pdfTeX error: pdflatex (file psfonts.map): cannot open font map file"]:
            with self.subTest(message=message):
                self.assertEqual(self.parse('! ' + message + '\n')[0]['code'], 'missing_font')

    def test_missing_file_classification_uses_final_extension_not_name_keywords(self):
        for name, expected in [
            ('metric-plot.png', 'missing_image'),
            ('mapping.png', 'missing_image'),
            ('TFM-plot.png', 'missing_image'),
            ('font map plot.png', 'missing_image'),
            ('metric-tools.sty', 'missing_package'),
            ('mapping.sty', 'missing_package'),
            ('TFM-tools.sty', 'missing_package'),
            ('font map tools.sty', 'missing_package'),
            ('metric-data.csv', 'tex_error'),
            ('mapping.csv', 'tex_error'),
            ('resource.tfm.png', 'missing_image'),
            ('resource.map.sty', 'missing_package'),
            ('resource.tfm', 'missing_font'),
            ('resource.map', 'missing_font'),
            ('resource.pfb', 'missing_font'),
            ('resource.otf', 'missing_font'),
            ('resource.ttf', 'missing_font'),
        ]:
            with self.subTest(name=name):
                self.assertEqual(self.parse(f"! LaTeX Error: File `{name}' not found.\n")[0]['code'], expected)


if __name__ == '__main__':
    unittest.main()
