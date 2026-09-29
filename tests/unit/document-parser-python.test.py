"""Small stdlib regression check for Form-image geometry and parser limits."""
import importlib.util
import math
from pathlib import Path

source = Path(__file__).resolve().parents[2] / "scripts" / "pdf-parser" / "parse.py"
spec = importlib.util.spec_from_file_location("document_parser", source)
parser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parser)


class Raw:
    FPDF_PAGEOBJ_IMAGE = 1
    FPDF_PAGEOBJ_FORM = 2


class Pdfium:
    raw = Raw


class Matrix:
    def __init__(self, a=1, b=0, c=0, d=1, e=0, f=0):
        self.values = a, b, c, d, e, f
        self.a, self.b, self.c, self.d, self.e, self.f = self.values

    def get(self):
        return self.values

    def on_point(self, x, y):
        a, b, c, d, e, f = self.values
        return a * x + c * y + e, b * x + d * y + f


class Item:
    def __init__(self, kind, level=0, container=None, quad=None, matrix=None):
        self.type, self.level, self.container = kind, level, container
        self.quad = quad or ((0, 0), (1, 0), (1, 1), (0, 1))
        self.matrix = matrix or Matrix()

    def get_quad_points(self):
        return self.quad

    def get_matrix(self):
        return self.matrix


class PosConv:
    def to_bitmap(self, x, y):
        return int(1.5 * x), int(1.5 * (220 - y))


def check_error(code, callback):
    try:
        callback()
    except ValueError as error:
        assert str(error) == code, (str(error), code)
    else:
        raise AssertionError(f"expected {code}")


def demo():
    direct = Item(Raw.FPDF_PAGEOBJ_IMAGE, quad=((80, 60), (360, 60), (360, 160), (80, 160)))
    candidates, count = parser.image_candidates([direct], Pdfium, PosConv(), 600, 330)
    assert count == 1
    assert candidates[0]["pixelBounds"] == {"left": 119, "top": 89, "right": 541, "bottom": 241}

    outer = Item(Raw.FPDF_PAGEOBJ_FORM, matrix=Matrix(1, .25, .3, 1, 10, 5))
    inner = Item(Raw.FPDF_PAGEOBJ_FORM, level=1, container=outer, matrix=Matrix(0, 1, -1, 0, 200, 0))
    nested = Item(Raw.FPDF_PAGEOBJ_IMAGE, level=2, container=inner, quad=((0, 0), (10, 0), (10, 20), (0, 20)))
    candidates, _ = parser.image_candidates([outer, inner, nested], Pdfium, PosConv(), 600, 330)
    assert candidates[0]["pixelBounds"] == {"left": 284, "top": 231, "right": 320, "bottom": 256}

    too_deep = Item(Raw.FPDF_PAGEOBJ_FORM, level=parser.MAX_FORM_DEPTH)
    check_error("PDF_FORM_DEPTH_LIMIT", lambda: parser.image_candidates([too_deep], Pdfium, PosConv(), 600, 330))
    invalid = Item(Raw.FPDF_PAGEOBJ_IMAGE, quad=((0, 0), (math.nan, 0), (1, 1), (0, 1)))
    check_error("PDF_IMAGE_GEOMETRY_INVALID", lambda: parser.image_candidates([invalid], Pdfium, PosConv(), 600, 330))
    degenerate = Item(Raw.FPDF_PAGEOBJ_IMAGE, quad=((0, 0), (1, 1), (2, 2), (3, 3)))
    check_error("PDF_IMAGE_GEOMETRY_INVALID", lambda: parser.image_candidates([degenerate], Pdfium, PosConv(), 600, 330))
    invalid_parent = Item(Raw.FPDF_PAGEOBJ_FORM, matrix=Matrix(e=parser.COORDINATE_LIMIT + 1))
    invalid_nested = Item(Raw.FPDF_PAGEOBJ_IMAGE, level=1, container=invalid_parent)
    check_error("PDF_IMAGE_GEOMETRY_INVALID", lambda: parser.image_candidates([invalid_parent, invalid_nested], Pdfium, PosConv(), 600, 330))
    check_error("PDF_PAGE_OBJECT_LIMIT", lambda: parser.image_candidates((Item(99) for _ in range(parser.MAX_OBJECTS_PER_PAGE + 1)), Pdfium, PosConv(), 600, 330))
    check_error("PDF_OBJECT_LIMIT", lambda: parser.image_candidates([Item(99)], Pdfium, PosConv(), 600, 330, parser.MAX_OBJECTS))


if __name__ == "__main__":
    demo()
    print("document-parser-python-ok")
