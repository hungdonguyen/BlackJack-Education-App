"""
Cosmic Swirl Card Theme Generator v2
=====================================
Uses AI-generated cosmic backgrounds + smart compositing to create
premium galaxy-themed playing cards matching the reference style:
- Rich cosmic swirl backgrounds with golden/blue/purple nebula
- Card content (numbers, suits) with cosmic fill + golden glow outline
- Golden ornate border
- Star sparkles throughout
"""

import os
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops

# ─── Configuration ───────────────────────────────────────────────────────────

INPUT_DIR  = os.path.join("public", "images", "cards", "default")
OUTPUT_DIR = os.path.join("public", "images", "cards", "cosmic")
CARD_W, CARD_H = 226, 314
CORNER_RADIUS = 14

# AI-generated background images
BG_DIR = os.path.join(
    os.path.expanduser("~"),
    ".gemini", "antigravity", "brain",
    "5956c2d9-30fe-4d40-b735-8e4bafc5ab51"
)

random.seed(42)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def rounded_rect_mask(w, h, r):
    """Return an L-mode image with a rounded rectangle = white."""
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([(0, 0), (w - 1, h - 1)], radius=r, fill=255)
    return mask


def load_and_resize_bg(path, w, h):
    """Load a background image and resize/crop to card dimensions."""
    bg = Image.open(path).convert("RGBA")
    # Crop center to card aspect ratio, then resize
    bg_w, bg_h = bg.size
    target_ratio = w / h
    bg_ratio = bg_w / bg_h

    if bg_ratio > target_ratio:
        # Wider — crop sides
        new_w = int(bg_h * target_ratio)
        left = (bg_w - new_w) // 2
        bg = bg.crop((left, 0, left + new_w, bg_h))
    else:
        # Taller — crop top/bottom
        new_h = int(bg_w / target_ratio)
        top = (bg_h - new_h) // 2
        bg = bg.crop((0, top, bg_w, top + new_h))

    bg = bg.resize((w, h), Image.LANCZOS)
    return bg


def detect_content_mask(img_arr):
    """Detect card content (non-white, non-transparent foreground)."""
    r, g, b, a = img_arr[:, :, 0], img_arr[:, :, 1], img_arr[:, :, 2], img_arr[:, :, 3]
    is_white = (r > 220) & (g > 220) & (b > 220)
    is_transparent = a < 30
    content = (~is_white) & (~is_transparent)
    return content


def add_golden_border(img, w, h, radius):
    """Draw a luxurious golden border frame."""
    draw = ImageDraw.Draw(img)

    # Outer border — warm gold
    for i in range(3):
        alpha = 200 - i * 40
        gold = (210, 170, 80, alpha)
        draw.rounded_rectangle(
            [(i, i), (w - 1 - i, h - 1 - i)],
            radius=radius - i,
            outline=gold,
            width=1
        )

    # Inner decorative line
    inset = 6
    draw.rounded_rectangle(
        [(inset, inset), (w - 1 - inset, h - 1 - inset)],
        radius=radius - inset,
        outline=(180, 150, 70, 100),
        width=1
    )

    return img


def add_star_sparkles(img, count=80):
    """Add bright star sparkle points."""
    draw = ImageDraw.Draw(img)
    w, h = img.size
    for _ in range(count):
        sx = random.randint(4, w - 5)
        sy = random.randint(4, h - 5)
        brightness = random.randint(200, 255)

        # Star color variations
        r_choice = random.random()
        if r_choice < 0.6:
            col = (brightness, brightness, brightness)  # white
        elif r_choice < 0.8:
            col = (brightness, brightness - 20, brightness - 60)  # warm
        else:
            col = (brightness - 40, brightness - 20, brightness)  # cool

        alpha = random.randint(120, 250)
        size_type = random.choices([0, 1, 2], weights=[5, 3, 1])[0]

        if size_type == 0:
            # Single bright pixel
            draw.point((sx, sy), fill=(*col, alpha))
        elif size_type == 1:
            # Small cross sparkle
            draw.point((sx, sy), fill=(*col, alpha))
            dim = alpha // 2
            draw.point((sx - 1, sy), fill=(*col, dim))
            draw.point((sx + 1, sy), fill=(*col, dim))
            draw.point((sx, sy - 1), fill=(*col, dim))
            draw.point((sx, sy + 1), fill=(*col, dim))
        else:
            # Tiny glow dot
            draw.ellipse(
                [(sx - 1, sy - 1), (sx + 1, sy + 1)],
                fill=(*col, alpha)
            )

    return img


def create_content_glow(content_mask_uint8, w, h):
    """Create a golden/cyan glow effect around the card content."""
    mask_img = Image.fromarray(content_mask_uint8, "L")

    # Wide outer glow (golden-amber)
    outer_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=8))
    outer_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_color = Image.new("RGBA", (w, h), (230, 190, 80, 120))
    outer_glow = Image.composite(glow_color, outer_glow, outer_glow_mask)

    # Medium glow (warm amber)
    mid_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=4))
    mid_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mid_color = Image.new("RGBA", (w, h), (240, 200, 100, 100))
    mid_glow = Image.composite(mid_color, mid_glow, mid_glow_mask)

    # Tight inner glow (bright white-cyan)
    inner_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=2))
    inner_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    inner_color = Image.new("RGBA", (w, h), (220, 235, 255, 90))
    inner_glow = Image.composite(inner_color, inner_glow, inner_glow_mask)

    # Combine all glow layers
    result = Image.alpha_composite(outer_glow, mid_glow)
    result = Image.alpha_composite(result, inner_glow)
    return result


def cosmic_tint_content(content_layer, content_mask, bg_cosmic, is_face_card=False):
    """
    Remap card content colors for cosmic theme:
    - Face cards (J, Q, K): keep original colors unchanged
    - Dark content (spades/clubs) -> pure white
    - Red content (hearts/diamonds) -> vivid bright red
    """
    w, h = content_layer.size
    content_arr = np.array(content_layer)
    mask_bool = content_mask

    # Face cards: return original content as-is
    if is_face_card:
        return content_layer

    # Detect which pixels are red-ish (hearts/diamonds) vs dark (spades/clubs)
    r, g, b = content_arr[:, :, 0], content_arr[:, :, 1], content_arr[:, :, 2]
    is_red = (r > 150) & (g < 100) & (b < 100) & mask_bool
    is_dark = (~is_red) & mask_bool

    result_arr = content_arr.copy()

    # ── Dark content (spades/clubs) -> PURE WHITE ──
    if np.any(is_dark):
        result_arr[is_dark, 0] = 255
        result_arr[is_dark, 1] = 255
        result_arr[is_dark, 2] = 255
        result_arr[is_dark, 3] = 255

    # ── Red content (hearts/diamonds) -> VIVID RED ──
    if np.any(is_red):
        result_arr[is_red, 0] = 255
        result_arr[is_red, 1] = 20
        result_arr[is_red, 2] = 20
        result_arr[is_red, 3] = 255

    return Image.fromarray(result_arr, "RGBA")


def create_face_card_backdrop(w, h, content_mask_uint8):
    """
    Create a semi-transparent dark frosted panel behind face card art.
    This gives the complex artwork a dark backing for contrast while
    keeping the cosmic background visible around the edges.
    """
    # Dilate the content mask to create a backdrop slightly larger than the art
    mask_img = Image.fromarray(content_mask_uint8, "L")
    dilated = mask_img.filter(ImageFilter.MaxFilter(size=7))
    dilated = dilated.filter(ImageFilter.GaussianBlur(radius=6))

    # Create a dark translucent layer
    backdrop = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dark_panel = Image.new("RGBA", (w, h), (8, 5, 20, 160))
    backdrop = Image.composite(dark_panel, backdrop, dilated)

    return backdrop


def add_sparkle_on_content(content_mask_uint8, w, h, density=0.03):
    """Add sparkle/glitter points directly on the card content."""
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    ys, xs = np.where(content_mask_uint8 > 0)
    if len(ys) == 0:
        return overlay

    num = max(1, int(len(ys) * density))
    indices = random.sample(range(len(ys)), min(num, len(ys)))

    for idx in indices:
        sx, sy = int(xs[idx]), int(ys[idx])
        choice = random.random()
        if choice < 0.4:
            col = (255, 255, 255)
        elif choice < 0.65:
            col = (255, 230, 150)  # gold sparkle
        elif choice < 0.85:
            col = (180, 200, 255)  # cool sparkle
        else:
            col = (255, 180, 220)  # pink sparkle

        alpha = random.randint(150, 255)
        draw.point((sx, sy), fill=(*col, alpha))

    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=0.5))
    return overlay


# ─── Find the generated backgrounds ─────────────────────────────────────────

def find_bg_images():
    """Find the AI-generated cosmic background images."""
    bg_files = []
    for fname in os.listdir(BG_DIR):
        if fname.startswith("cosmic_bg_") and fname.endswith(".png"):
            bg_files.append(os.path.join(BG_DIR, fname))

    if not bg_files:
        raise FileNotFoundError(f"No cosmic background images found in {BG_DIR}")

    print(f"  Found {len(bg_files)} background(s)")
    return sorted(bg_files)


def find_card_back_bg():
    """Find the AI-generated card back image."""
    for fname in os.listdir(BG_DIR):
        if fname.startswith("cosmic_card_back") and fname.endswith(".png"):
            return os.path.join(BG_DIR, fname)
    return None


# ─── Process a single card ───────────────────────────────────────────────────

def is_face_card_file(fname):
    """Check if a filename is a face card (J, Q, K)."""
    base = os.path.splitext(fname)[0]
    return base.endswith("-J") or base.endswith("-Q") or base.endswith("-K")


def process_card(input_path, output_path, bg_images):
    """Apply the cosmic swirl transformation to one card."""
    original = Image.open(input_path).convert("RGBA")
    w, h = original.size
    fname = os.path.basename(input_path)
    face_card = is_face_card_file(fname)

    # ── 1. Detect content ──
    arr = np.array(original)
    content_mask = detect_content_mask(arr)
    content_mask_uint8 = (content_mask.astype(np.uint8)) * 255

    # ── 2. Extract content layer ──
    content_rgba = arr.copy()
    content_rgba[~content_mask] = [0, 0, 0, 0]
    content_layer = Image.fromarray(content_rgba, "RGBA")

    # ── 3. Pick & prepare cosmic background ──
    bg_path = random.choice(bg_images)
    cosmic_bg = load_and_resize_bg(bg_path, w, h)

    # Darken slightly for better contrast
    cosmic_bg = ImageEnhance.Brightness(cosmic_bg).enhance(0.85)

    # ── 4. Tint the content with cosmic texture ──
    cosmic_content = cosmic_tint_content(content_layer, content_mask, cosmic_bg, is_face_card=face_card)

    # ── 5. Create glow behind content ──
    glow = create_content_glow(content_mask_uint8, w, h)

    # ── 6. Sparkle on content ──
    sparkle = add_sparkle_on_content(content_mask_uint8, w, h, density=0.04)

    # ── 7. Compose ──
    result = cosmic_bg.copy()
    result = add_star_sparkles(result, count=60)
    result = Image.alpha_composite(result, glow)
    result = Image.alpha_composite(result, cosmic_content)
    result = Image.alpha_composite(result, sparkle)

    # ── 8. Rounded corners ──
    card_mask = rounded_rect_mask(w, h, CORNER_RADIUS)
    result.putalpha(card_mask)

    # ── 9. Golden border ──
    result = add_golden_border(result, w, h, CORNER_RADIUS)

    result.save(output_path, "PNG")


def process_card_back(output_path):
    """Create a cosmic card back from the AI-generated design."""
    w, h = CARD_W, CARD_H

    card_back_path = find_card_back_bg()
    if card_back_path:
        result = load_and_resize_bg(card_back_path, w, h)
    else:
        # Fallback: use one of the cosmic bgs
        bg_images = find_bg_images()
        result = load_and_resize_bg(bg_images[0], w, h)
        result = ImageEnhance.Brightness(result).enhance(0.7)

    result = add_star_sparkles(result, count=150)

    # Rounded corners
    card_mask = rounded_rect_mask(w, h, CORNER_RADIUS)
    result.putalpha(card_mask)

    # Golden border
    result = add_golden_border(result, w, h, CORNER_RADIUS)

    result.save(output_path, "PNG")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    bg_images = find_bg_images()
    files = sorted(f for f in os.listdir(INPUT_DIR) if f.endswith(".png"))
    total = len(files)
    print(f"\n[*] Cosmic Swirl v2 - processing {total} cards ...\n")

    for i, fname in enumerate(files, 1):
        input_path = os.path.join(INPUT_DIR, fname)
        output_path = os.path.join(OUTPUT_DIR, fname)

        if fname == "card-back.png":
            print(f"  [{i:2d}/{total}] + {fname} (card back)")
            process_card_back(output_path)
        else:
            print(f"  [{i:2d}/{total}] + {fname}")
            process_card(input_path, output_path, bg_images)

    print(f"\n[OK] Done! {total} cosmic cards saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
