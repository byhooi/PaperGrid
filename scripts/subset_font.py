import argparse
import base64
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def main():
    parser = argparse.ArgumentParser(description="Build the PaperGrid label font from Noto Sans SC.")
    parser.add_argument("source", type=Path)
    arguments = parser.parse_args()
    assets = Path(__file__).resolve().parents[1] / "assets"
    font = TTFont(arguments.source)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": 400}, inplace=True)
    options = subset.Options()
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.name_legacy = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text="".join(chr(codepoint) for codepoint in range(32, 127)) + "姓名班级学号题目：")
    subsetter.subset(font)
    replacements = {1: "PaperGridSans", 2: "Regular", 3: "PaperGridSans-Regular", 4: "PaperGridSans Regular", 6: "PaperGridSans-Regular"}
    for record in list(font["name"].names):
        if record.nameID in replacements:
            font["name"].setName(replacements[record.nameID], record.nameID, record.platformID, record.platEncID, record.langID)
    font.save(assets / "PaperGridSans.ttf")
    encoded = base64.b64encode((assets / "PaperGridSans.ttf").read_bytes()).decode("ascii")
    (assets / "papergrid-font.js").write_text("globalThis.PaperGrid.fontBase64 = '" + encoded + "';\n", encoding="utf-8")
    print(f"Generated label font: {(assets / 'PaperGridSans.ttf').stat().st_size} bytes")


if __name__ == "__main__":
    main()
