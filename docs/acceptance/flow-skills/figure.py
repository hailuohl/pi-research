"""acceptance-figure/v1 synthetic-data acceptance chart.

Uses only the Python standard library. Generates:
  figure.png        480x320 RGB PNG with axes, white background, 21 points
  points.csv        header x,y and 21 points y = x*x
  figure-check.json dimensions, point count, finite bounds, protocol label

This is a synthetic software-acceptance fixture; it proves artifact
generation only and is not scientific evidence.
"""

import binascii
import json
import math
import os
import struct
import zlib

WIDTH = 480
HEIGHT = 320
N_POINTS = 21
PROTOCOL = "acceptance-figure/v1"
OUT_DIR = os.environ.get("PI_OUTPUT_DIR", ".")


def make_points():
    pts = []
    for i in range(N_POINTS):
        x = i * 0.05
        x = round(x, 10)
        y = x * x
        y = round(y, 10)
        pts.append((x, y))
    assert len(pts) == 21, "point count must be 21"
    assert pts[0] == (0.0, 0.0), "first point must be (0,0)"
    assert pts[-1] == (1.0, 1.0), "last point must be (1,1)"
    for x, y in pts:
        assert math.isfinite(x) and math.isfinite(y), "non-finite value"
    return pts


def write_csv(pts):
    lines = ["x,y"]
    for x, y in pts:
        lines.append("%r,%r" % (x, y))
    text = "\n".join(lines) + "\n"
    with open(os.path.join(OUT_DIR, "points.csv"), "w", encoding="utf-8") as f:
        f.write(text)
    return text


class Canvas:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        # white background, RGB rows with filter byte 0
        self.rows = [bytearray([0]) + bytearray(b"\xff\xff\xff" * w) for _ in range(h)]

    def px(self, x, y, color):
        if 0 <= x < self.w and 0 <= y < self.h:
            base = 1 + 3 * x
            row = self.rows[y]
            row[base:base + 3] = bytes(color)

    def line(self, x0, y0, x1, y1, color):
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        while True:
            self.px(x0, y0, color)
            # thicken lines by drawing neighbours
            self.px(x0 + 1, y0, color)
            self.px(x0, y0 + 1, color)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def to_png(self):
        def chunk(tag, data):
            return (struct.pack(">I", len(data)) + tag + data
                    + struct.pack(">I", binascii.crc32(tag + data) & 0xFFFFFFFF))

        sig = b"\x89PNG\r\n\x1a\n"
        ihdr = struct.pack(">IIBBBBB", self.w, self.h, 8, 2, 0, 0, 0)
        raw = b"".join(bytes(r) for r in self.rows)
        idat = zlib.compress(raw, 9)
        return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def draw(pts):
    c = Canvas(WIDTH, HEIGHT)
    black = (0, 0, 0)
    blue = (0, 60, 180)
    margin_l, margin_r, margin_t, margin_b = 42, 16, 16, 36
    x0, x1 = margin_l, WIDTH - 1 - margin_r
    y0, y1 = HEIGHT - 1 - margin_b, margin_t  # y0 = bottom (pixel), y1 = top

    def mapx(x):
        return x0 + int(round(x * (x1 - x0)))

    def mapy(y):
        return y0 - int(round(y * (y0 - y1)))

    # axes
    c.line(x0, y0, x1, y0, black)  # x axis
    c.line(x0, y0, x0, y1, black)  # y axis
    # ticks each 0.25
    for t in (0.25, 0.5, 0.75, 1.0):
        tx = mapx(t)
        c.line(tx, y0, tx, y0 + 4, black)
        ty = mapy(t)
        c.line(x0, ty, x0 - 4, ty, black)

    # polyline
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        c.line(mapx(ax), mapy(ay), mapx(bx), mapy(by), blue)
    # markers
    for x, y in pts:
        mx, my = mapx(x), mapy(y)
        for dx in (-2, -1, 0, 1, 2):
            for dy in (-2, -1, 0, 1, 2):
                if dx * dx + dy * dy <= 4:
                    c.px(mx + dx, my + dy, (200, 30, 30))
    return c.to_png()


def main():
    pts = make_points()
    write_csv(pts)
    png = draw(pts)
    assert png[:8] == b"\x89PNG\r\n\x1a\n", "PNG signature missing"
    assert struct.unpack(">II", png[16:24]) == (WIDTH, HEIGHT), "PNG dimensions wrong"
    with open(os.path.join(OUT_DIR, "figure.png"), "wb") as f:
        f.write(png)

    check = {
        "protocol": PROTOCOL,
        "width": WIDTH,
        "height": HEIGHT,
        "pointCount": len(pts),
        "xMin": min(x for x, _ in pts),
        "xMax": max(x for x, _ in pts),
        "yMin": min(y for _, y in pts),
        "yMax": max(y for _, y in pts),
        "finite": True,
        "synthetic": True,
        "note": "Synthetic-data acceptance chart; not scientific evidence.",
    }
    with open(os.path.join(OUT_DIR, "figure-check.json"), "w", encoding="utf-8") as f:
        json.dump(check, f, indent=2)
        f.write("\n")
    print("acceptance-figure/v1 artifacts written to", OUT_DIR)


if __name__ == "__main__":
    main()
