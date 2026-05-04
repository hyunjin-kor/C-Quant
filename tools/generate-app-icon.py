"""
Generate the C-Quant app icon as PNG (multiple sizes) and ICO.

Design intent:
- Same identity — rounded blue square, large white "C", chart bars +
  upward trend arrow on the right.
- Cleaner: removed the cluttered "badge" decoration in the upper-right
  corner of the previous icon.
- Sharper: drawn at 2048x2048 then downsampled with Lanczos for crisp
  anti-aliasing at every target size.

Outputs:
- assets/app-icon.png  (512x512, used by README + macOS/Linux build)
- assets/app-icon@1024.png  (1024x1024, high-DPI archive)
- assets/app-icon.ico  (multi-size 256/128/64/48/32/16, used by Windows build)
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

CANVAS = 2048
RADIUS = int(CANVAS * 0.20)  # rounded-square corner radius

# Toss-style blue with subtle vertical gradient — matches the C-Quant palette
BLUE_TOP = (94, 154, 255)
BLUE_BOTTOM = (29, 113, 245)
WHITE = (255, 255, 255, 255)
MINT = (168, 240, 213, 255)


def vertical_gradient(width, height, top_rgb, bottom_rgb):
    """Top→bottom linear gradient as an RGB image."""
    base = Image.new("RGB", (width, height), top_rgb)
    pixels = base.load()
    for y in range(height):
        ratio = y / max(1, height - 1)
        r = int(top_rgb[0] + (bottom_rgb[0] - top_rgb[0]) * ratio)
        g = int(top_rgb[1] + (bottom_rgb[1] - top_rgb[1]) * ratio)
        b = int(top_rgb[2] + (bottom_rgb[2] - top_rgb[2]) * ratio)
        for x in range(width):
            pixels[x, y] = (r, g, b)
    return base


def rounded_mask(width, height, radius):
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, width - 1, height - 1), radius=radius, fill=255
    )
    return mask


def draw_icon():
    # 1) Rounded square background with vertical gradient
    bg = vertical_gradient(CANVAS, CANVAS, BLUE_TOP, BLUE_BOTTOM).convert("RGBA")
    mask = rounded_mask(CANVAS, CANVAS, RADIUS)
    base = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    base.paste(bg, (0, 0), mask)

    overlay = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # 2) Large white "C" — stroked arc, anchored to the LEFT half so the
    #    right half is free for the chart graphic.
    cx, cy = int(CANVAS * 0.36), int(CANVAS * 0.52)
    c_radius = int(CANVAS * 0.28)
    c_thickness = int(CANVAS * 0.13)
    arc_box = (cx - c_radius, cy - c_radius, cx + c_radius, cy + c_radius)
    gap_half_deg = 40  # 80° opening on the right
    d.arc(
        arc_box,
        start=gap_half_deg,
        end=360 - gap_half_deg,
        fill=WHITE,
        width=c_thickness,
    )
    # Cap the two open ends with circles so the C terminates softly.
    end_r = c_thickness // 2
    for angle_deg in (gap_half_deg, -gap_half_deg):
        a = math.radians(angle_deg)
        ex = cx + int(c_radius * math.cos(a))
        ey = cy + int(c_radius * math.sin(a))
        d.ellipse((ex - end_r, ey - end_r, ex + end_r, ey + end_r), fill=WHITE)

    # 3) Two chart bars on the right, fully clear of the C.
    bar_w = int(CANVAS * 0.09)
    bar_radius = bar_w // 2
    base_y = int(CANVAS * 0.78)

    # White (short) bar — closer in
    bar1_x = int(CANVAS * 0.70)
    bar1_top = int(CANVAS * 0.55)
    d.rounded_rectangle(
        (bar1_x, bar1_top, bar1_x + bar_w, base_y),
        radius=bar_radius,
        fill=WHITE,
    )

    # Mint (tall) bar — outer right
    bar2_x = int(CANVAS * 0.83)
    bar2_top = int(CANVAS * 0.42)
    d.rounded_rectangle(
        (bar2_x, bar2_top, bar2_x + bar_w, base_y),
        radius=bar_radius,
        fill=MINT,
    )

    # 4) Upward trend arrow — clearly above the chart bars, never overlaps
    #    the C or the bars.
    arrow_w = int(CANVAS * 0.04)
    arrow_pts = [
        (int(CANVAS * 0.55), int(CANVAS * 0.45)),  # near top of white bar
        (int(CANVAS * 0.68), int(CANVAS * 0.36)),
        (int(CANVAS * 0.82), int(CANVAS * 0.27)),  # tip near upper-right
    ]
    d.line(arrow_pts, fill=WHITE, width=arrow_w, joint="curve")

    # Arrowhead — clean isosceles triangle perpendicular to final segment.
    tx, ty = arrow_pts[-1]
    px, py = arrow_pts[-2]
    dx, dy = tx - px, ty - py
    length = math.hypot(dx, dy) or 1
    ux, uy = dx / length, dy / length
    nx, ny = -uy, ux  # perpendicular
    head_len = int(CANVAS * 0.08)
    head_half = int(CANVAS * 0.045)
    p1 = (tx + int(head_len * 0.25 * ux), ty + int(head_len * 0.25 * uy))
    p2 = (int(tx - head_len * ux + head_half * nx),
          int(ty - head_len * uy + head_half * ny))
    p3 = (int(tx - head_len * ux - head_half * nx),
          int(ty - head_len * uy - head_half * ny))
    d.polygon([p1, p2, p3], fill=WHITE)

    # Composite the foreground onto the rounded blue background.
    out = Image.alpha_composite(base, overlay)

    # Final clip with the rounded mask to remove any spillover.
    final = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    final.paste(out, (0, 0), mask)
    return final


def main():
    icon = draw_icon()

    png_path = ASSETS / "app-icon.png"
    icon.resize((512, 512), Image.LANCZOS).save(png_path, format="PNG", optimize=True)
    print(f"wrote {png_path}")

    icon.resize((1024, 1024), Image.LANCZOS).save(
        ASSETS / "app-icon@1024.png", format="PNG", optimize=True
    )
    print(f"wrote {ASSETS / 'app-icon@1024.png'}")

    ico_path = ASSETS / "app-icon.ico"
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icon.resize((256, 256), Image.LANCZOS).save(
        ico_path, format="ICO", sizes=sizes
    )
    print(f"wrote {ico_path}")


if __name__ == "__main__":
    main()
