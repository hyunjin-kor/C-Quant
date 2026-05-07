"""
Process the hand-crafted source app icon into all desktop targets.

Source: assets/app-icon-source.png (a square-ish hand-drawn / AI-generated
        image — typically 960-1024 px, with the visual content already
        composed to fill the canvas).

Outputs:
- assets/app-icon.png        (512x512, README hero + macOS / Linux build)
- assets/app-icon@1024.png   (1024x1024, high-DPI archive)
- assets/app-icon.ico        (multi-size 256/128/64/48/32/16, Windows build)

Pipeline:
1. Open source.
2. Center-crop to a perfect square (using the shorter side).
3. Resize to 1024x1024 with Lanczos resampling.
4. Apply a soft rounded-square mask (14% radius — iOS / modern desktop standard).
5. Save the three target artefacts.

Run: python tools/generate-app-icon.py
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "app-icon-source.png"

CANVAS = 1024
RADIUS_PCT = 0.14  # 14% of canvas — modern iOS/desktop standard


def center_square_crop(img: Image.Image) -> Image.Image:
    """Crop to a perfect square using the shorter dimension."""
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=radius, fill=255
    )
    # A 1px feather smooths the edge so the icon doesn't look pixel-aliased
    # when downsampled to 16/32/48 px.
    return mask.filter(ImageFilter.GaussianBlur(radius=0.6))


def process() -> Image.Image:
    if not SOURCE.exists():
        raise FileNotFoundError(
            f"source not found: {SOURCE}\n"
            f"save the hand-crafted icon there before running this script."
        )

    img = Image.open(SOURCE).convert("RGBA")

    # 1) center-crop to square
    img = center_square_crop(img)

    # 2) resize to canonical 1024x1024
    img = img.resize((CANVAS, CANVAS), Image.LANCZOS)

    # 3) rounded-square mask
    radius = int(CANVAS * RADIUS_PCT)
    mask = rounded_mask(CANVAS, radius)
    final = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    final.paste(img, (0, 0), mask)

    return final


def main() -> None:
    icon = process()

    png_512 = ASSETS / "app-icon.png"
    icon.resize((512, 512), Image.LANCZOS).save(png_512, format="PNG", optimize=True)
    print(f"wrote {png_512}")

    png_1024 = ASSETS / "app-icon@1024.png"
    icon.save(png_1024, format="PNG", optimize=True)
    print(f"wrote {png_1024}")

    ico_path = ASSETS / "app-icon.ico"
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icon.resize((256, 256), Image.LANCZOS).save(ico_path, format="ICO", sizes=sizes)
    print(f"wrote {ico_path}")


if __name__ == "__main__":
    main()
