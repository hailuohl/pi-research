"""Select an existing glyph-complete font for new charts without changing legacy style."""
from __future__ import annotations

import hashlib
from pathlib import Path

import alignment_common as common
import research


def apply(fig, out):
    from matplotlib import font_manager
    from matplotlib.text import Text
    from fontTools.ttLib import TTFont
    for axes in fig.axes:
        for axis in (axes.xaxis, axes.yaxis):
            axis.get_ticklabels(which="both")
            axis.get_offset_text().set_text(axis.get_major_formatter().get_offset())
    texts = [item for item in fig.findobj(match=Text) if item.get_text()]
    characters = set("0123456789.-−+eE()%× ")
    for item in texts:
        characters.update(item.get_text())
    characters.difference_update("\n\r\t")
    needed = {ord(character) for character in characters}
    candidates = [Path("C:/Windows/Fonts/NotoSerifSC-VF.ttf"), Path("C:/Windows/Fonts/msyh.ttc"), Path("C:/Windows/Fonts/simhei.ttf")]
    candidates += [Path(item.fname) for item in font_manager.fontManager.ttflist]
    selected = None
    for path in dict.fromkeys(candidates):
        if not path.is_file():
            continue
        try:
            with TTFont(str(path), fontNumber=0, lazy=True) as font:
                cmap = font.getBestCmap() or {}
                if needed.issubset(cmap):
                    selected = path
                    break
        except Exception:
            continue
    if selected is None:
        return {"status": "partial", "issues": ["No installed font covers all chart glyphs"], "required_codepoints": sorted(needed)}
    source_sha = research.digest(selected)
    from fontTools.subset import Options, Subsetter
    from fontTools.varLib.instancer import instantiateVariableFont
    font = TTFont(str(selected), fontNumber=0)
    try:
        options = Options()
        options.name_IDs = [1, 2, 3, 4, 6]
        subset = Subsetter(options=options)
        subset.populate(unicodes=needed)
        subset.subset(font)
        if "fvar" in font:
            instantiateVariableFont(font, {"wght": 400}, inplace=True, updateFontNames=True)
        family = "YanZhou-" + hashlib.sha256((source_sha + repr(sorted(needed))).encode()).hexdigest()[:12]
        for record in list(font["name"].names):
            if record.nameID in (1, 4, 6):
                font["name"].setName(family, record.nameID, record.platformID, record.platEncID, record.langID)
        target = Path(out) / "chart-font.ttf"
        font.save(target)
    finally:
        font.close()
    font_manager.fontManager.addfont(str(target))
    for item in texts:
        properties = item.get_fontproperties().copy()
        properties.set_file(str(target))
        item.set_fontproperties(properties)
    fig.canvas.draw()
    return {"status": "complete", "issues": [], "source_font": selected.name, "source_sha256": source_sha,
            "subset": target.name, "subset_sha256": research.digest(target), "glyph_count": len(needed)}


def release(out):
    import gc
    from matplotlib import font_manager
    from matplotlib.mathtext import MathTextParser
    selected = (Path(out) / "chart-font.ttf").resolve()
    # Matplotlib's FT2Font cache keeps a Windows handle open and prevents the atomic directory rename.
    font_manager._get_font.cache_clear()
    MathTextParser._parse_cached.cache_clear()
    font_manager.fontManager.ttflist[:] = [item for item in font_manager.fontManager.ttflist if Path(item.fname).resolve() != selected]
    font_manager.fontManager._findfont_cached.cache_clear()
    gc.collect()
