"""
Apply rounded corners (alpha-cut) to README / USAGE screenshots in
docs/images/ so the outer image frame matches the rounded cards inside
the app UI.

Run: python tools/round-screenshot-corners.py
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "docs" / "images"

# Native screenshot capture is 1440 wide. The app's largest cards use
# --radius-xl: 22px. 20px keeps the outer frame visually consistent
# without dwarfing the inner cards once GitHub scales the image down.
RADIUS = 20

TARGETS = [
    "shot-cmd-k.png",
    "shot-command-dark.png",
    "shot-command-light-ko.png",
    "shot-command-light.png",
    "shot-desk-light.png",
    "shot-drivers-light.png",
    "shot-sources-light.png",
    "shot-watchlist-drawer.png",
]


def round_corners(path: Path, radius: int) -> None:
    image = Image.open(path).convert("RGBA")
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, image.size[0], image.size[1]),
        radius=radius,
        fill=255,
    )
    # Composite the source image onto a transparent canvas using the
    # rounded-rectangle mask as the alpha channel. This preserves the
    # original RGB pixels and only zeroes out the four corners.
    out = Image.new("RGBA", image.size, (0, 0, 0, 0))
    out.paste(image, (0, 0), mask)
    out.save(path, "PNG", optimize=True)
    print(f"rounded {path.relative_to(ROOT)}")


def main() -> None:
    for name in TARGETS:
        path = IMAGES / name
        if not path.exists():
            print(f"skip (missing): {path.relative_to(ROOT)}")
            continue
        round_corners(path, RADIUS)


if __name__ == "__main__":
    main()
