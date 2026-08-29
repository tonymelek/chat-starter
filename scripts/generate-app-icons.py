#!/usr/bin/env python3
"""Rasterize the Meltek mark into Expo icon, splash, and adaptive-icon assets."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images"

NAVY = (10, 37, 64, 255)  # #0A2540
MIST = (245, 247, 250, 255)  # #F5F7FA
CORAL = (255, 107, 74, 255)  # #FF6B4A
WHITE = (255, 255, 255, 255)

# Official Meltek favicon.svg paths, viewBox 0 0 64 64
LEFT = [(12, 20), (30, 20), (40, 32), (30, 44), (12, 44), (22, 32)]
RIGHT = [(34, 20), (52, 20), (62, 32), (52, 44), (34, 44), (44, 32)]

AA = 4


def _scale(points: list[tuple[float, float]], scale: float, ox: float, oy: float):
    return [(x * scale + ox, y * scale + oy) for x, y in points]


def _draw_chevrons(draw: ImageDraw.ImageDraw, scale: float, ox: float, oy: float, left, right):
    draw.polygon(_scale(LEFT, scale, ox, oy), fill=left)
    draw.polygon(_scale(RIGHT, scale, ox, oy), fill=right)


def render(
    size: int,
    *,
    background,
    viewbox_px: int | None = None,
    left=MIST,
    right=CORAL,
    rounded: int | None = None,
) -> Image.Image:
    """Draw the 64-unit mark into a square canvas. viewbox_px is how large the 64-unit box is."""
    canvas = size * AA
    vb = (viewbox_px or size) * AA
    ox = (canvas - vb) / 2
    oy = (canvas - vb) / 2
    scale = vb / 64

    img = Image.new("RGBA", (canvas, canvas), background)
    draw = ImageDraw.Draw(img)
    if rounded:
        mask = Image.new("L", (canvas, canvas), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            (0, 0, canvas - 1, canvas - 1), radius=rounded * AA, fill=255
        )
        bg = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        filled = Image.new("RGBA", (canvas, canvas), background)
        img = Image.composite(filled, bg, mask)
        draw = ImageDraw.Draw(img)

    _draw_chevrons(draw, scale, ox, oy, left, right)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    render(1024, background=NAVY).save(OUT / "icon.png")
    render(1024, background=NAVY, viewbox_px=int(1024 * 0.62)).save(OUT / "splash-icon.png")
    render(192, background=NAVY, rounded=48).save(OUT / "favicon.png")
    Image.new("RGBA", (1024, 1024), NAVY).save(OUT / "android-icon-background.png")
    render(1024, background=(0, 0, 0, 0), viewbox_px=int(1024 * 0.58)).save(
        OUT / "android-icon-foreground.png"
    )
    render(
        1024,
        background=(0, 0, 0, 0),
        viewbox_px=int(1024 * 0.58),
        left=WHITE,
        right=WHITE,
    ).save(OUT / "android-icon-monochrome.png")
    render(512, background=NAVY, rounded=128).save(OUT / "meltek-mark.png")

    print(f"Wrote icons to {OUT}")


if __name__ == "__main__":
    main()
