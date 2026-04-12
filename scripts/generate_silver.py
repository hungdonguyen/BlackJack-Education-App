"""
Silver Deck Generator
=====================
Creates a Sterling Silver card deck by color-shifting the Gold deck.
Gold hues (warm amber R>G>B) → Cool Silver/Steel (balanced R≈G≈B with slight blue bias).

The approach mirrors how the Gold deck was built from the Default deck,
but instead of warming colors, we cool them into a metallic silver palette.
"""

import os
import numpy as np
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter

# ─── Configuration ───────────────────────────────────────────────────────────

INPUT_DIR  = os.path.join("public", "images", "cards", "gold")
OUTPUT_DIR = os.path.join("public", "images", "cards", "silver")
CARD_W, CARD_H = 226, 314
CORNER_RADIUS = 14


def gold_to_silver(img: Image.Image) -> Image.Image:
    """
    Convert a gold-tinted card to a silver/steel look.
    
    Strategy:
    1. Desaturate the gold warmth
    2. Shift remaining color toward cool blue-gray
    3. Boost contrast slightly for metallic sheen
    4. Add subtle blue tint for steel effect
    """
    arr = np.array(img).astype(np.float64)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    a = arr[:, :, 3] if arr.shape[2] == 4 else np.full_like(r, 255.0)
    
    # Calculate luminance
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    
    # ── Step 1: Heavily desaturate (remove gold warmth) ──
    desat_factor = 0.15  # Keep only 15% of original saturation
    new_r = lum + (r - lum) * desat_factor
    new_g = lum + (g - lum) * desat_factor
    new_b = lum + (b - lum) * desat_factor
    
    # ── Step 2: Add cool blue-steel tint ──
    # Slightly reduce red, boost blue for steel look
    new_r = new_r * 0.92
    new_g = new_g * 0.96
    new_b = new_b * 1.08
    
    # ── Step 3: Boost contrast for metallic sheen ──
    # Push highlights whiter, darks slightly darker
    mid = 128.0
    contrast = 1.15
    new_r = mid + (new_r - mid) * contrast
    new_g = mid + (new_g - mid) * contrast
    new_b = mid + (new_b - mid) * contrast
    
    # ── Step 4: Brighten slightly for silver luminosity ──
    brightness = 1.08
    new_r *= brightness
    new_g *= brightness
    new_b *= brightness
    
    # Clamp values
    arr[:, :, 0] = np.clip(new_r, 0, 255)
    arr[:, :, 1] = np.clip(new_g, 0, 255)
    arr[:, :, 2] = np.clip(new_b, 0, 255)
    arr[:, :, 3] = a
    
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def add_silver_border(img: Image.Image) -> Image.Image:
    """
    Replace any gold border tint with a cool silver border.
    Draws a subtle silver chrome border at the card edges.
    """
    w, h = img.size
    draw = ImageDraw.Draw(img)
    
    # Outer border — bright silver
    for i in range(3):
        alpha = 200 - i * 40
        silver = (200, 210, 220, alpha)
        draw.rounded_rectangle(
            [(i, i), (w - 1 - i, h - 1 - i)],
            radius=CORNER_RADIUS - i,
            outline=silver,
            width=1
        )
    
    # Inner decorative line — subtle steel
    inset = 6
    draw.rounded_rectangle(
        [(inset, inset), (w - 1 - inset, h - 1 - inset)],
        radius=CORNER_RADIUS - inset,
        outline=(180, 190, 200, 80),
        width=1
    )
    
    return img


def process_card(input_path: str, output_path: str):
    """Convert one gold card to silver."""
    img = Image.open(input_path).convert("RGBA")
    
    # Apply gold→silver color transformation
    silver_img = gold_to_silver(img)
    
    # Redraw the border with silver tones
    silver_img = add_silver_border(silver_img)
    
    silver_img.save(output_path, "PNG")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    files = sorted(f for f in os.listdir(INPUT_DIR) if f.endswith(".png"))
    total = len(files)
    print(f"\n[*] Silver Deck Generator — processing {total} cards ...\n")
    
    for i, fname in enumerate(files, 1):
        input_path = os.path.join(INPUT_DIR, fname)
        output_path = os.path.join(OUTPUT_DIR, fname)
        print(f"  [{i:2d}/{total}] + {fname}")
        process_card(input_path, output_path)
    
    print(f"\n[OK] Done! {total} silver cards saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
