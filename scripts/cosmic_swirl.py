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

# ─── Cosmic Suit Palettes (Pale/Luminous) ────────────────────────────────────
SUIT_PALETTES = {
    "S": { # Spades - Pale Cyan
        "main": (180, 240, 255),
        "glow_outer": (0, 180, 255, 120),
        "glow_mid": (130, 220, 255, 100),
        "border": (150, 230, 255)
    },
    "H": { # Hearts - Soft Rose
        "main": (255, 180, 220),
        "glow_outer": (255, 80, 180, 120),
        "glow_mid": (255, 150, 200, 100),
        "border": (255, 180, 210)
    },
    "D": { # Diamonds - Pale Gold
        "main": (255, 230, 160),
        "glow_outer": (255, 180, 80, 120),
        "glow_mid": (255, 210, 130, 100),
        "border": (255, 220, 170)
    },
    "C": { # Clubs - Soft Mint
        "main": (180, 255, 220),
        "glow_outer": (80, 255, 180, 120),
        "glow_mid": (150, 255, 200, 100),
        "border": (180, 245, 210)
    },
    "default": {
        "main": (180, 240, 255),
        "glow_outer": (0, 220, 255, 120),
        "glow_mid": (100, 240, 255, 100),
        "border": (100, 240, 255)
    }
}


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


def detect_content_mask_face_card(img_arr):
    """
    Detect content for face cards using sealed-outline flood-fill.

    Strategy:
    1. Dilate colored outlines by 3px to seal hairline cracks in figure art
    2. Flood-fill from card edges through white areas NOT blocked by sealed outlines
       → reaches corner bg, frame interior gaps, BUT NOT face/skin whites
       (because sealed outlines block access to interior holes)
    3. Content = colored pixels + unreachable white areas (face/skin)
    4. Gaussian-smooth the final mask for clean edges
    """
    from scipy import ndimage

    r, g, b, a = img_arr[:, :, 0], img_arr[:, :, 1], img_arr[:, :, 2], img_arr[:, :, 3]
    h, w = r.shape

    # ── Pixel categories ──
    is_white = (r > 200) & (g > 200) & (b > 200)
    is_transparent = a < 30
    is_colored = (~is_white) & (~is_transparent)

    # ── Step 1: seal hairline cracks in figure outlines ──
    # Dilate colored pixels by ~3px so 1-2px gaps in ink lines get sealed.
    # This prevents flood-fill from leaking into face/skin white areas.
    colored_img = Image.fromarray((is_colored.astype(np.uint8) * 255), "L")
    sealed = colored_img.filter(ImageFilter.MaxFilter(size=7))  # 3px expansion each side
    sealed_bool = np.array(sealed) > 127

    # ── Step 2: build passable map for flood-fill ──
    # White/transparent pixels that are NOT blocked by sealed outlines
    passable = (is_white | is_transparent) & (~sealed_bool)

    # ── Step 3: flood-fill from card edges ──
    margin = 15
    edge_seeds = np.zeros((h, w), dtype=bool)
    edge_seeds[:margin, :] = True
    edge_seeds[-margin:, :] = True
    edge_seeds[:, :margin] = True
    edge_seeds[:, -margin:] = True
    edge_seeds = edge_seeds & passable

    struct = np.ones((3, 3), dtype=int)  # 8-connectivity
    labeled, _ = ndimage.label(passable, structure=struct)

    edge_labels = set(labeled[edge_seeds].flatten())
    edge_labels.discard(0)

    reachable_bg = np.zeros((h, w), dtype=bool)
    for lbl in edge_labels:
        reachable_bg |= (labeled == lbl)

    # Also mark outer_bg from original white+transparent (unsealed) for corners
    is_bg_passable_orig = is_white | is_transparent
    labeled_orig, _ = ndimage.label(is_bg_passable_orig, structure=struct)
    edge_seeds_orig = np.zeros((h, w), dtype=bool)
    edge_seeds_orig[:margin, :] = True
    edge_seeds_orig[-margin:, :] = True
    edge_seeds_orig[:, :margin] = True
    edge_seeds_orig[:, -margin:] = True
    edge_seeds_orig = edge_seeds_orig & is_bg_passable_orig
    edge_labels_orig = set(labeled_orig[edge_seeds_orig].flatten())
    edge_labels_orig.discard(0)
    outer_bg = np.zeros((h, w), dtype=bool)
    for lbl in edge_labels_orig:
        outer_bg |= (labeled_orig == lbl)

    # Combine: any pixel reachable via either method = background
    all_bg = reachable_bg | outer_bg

    # ── Step 4: content = colored + whites NOT reachable ──
    trapped_white = is_white & (~all_bg) & (~is_transparent)
    content_mask = is_colored | trapped_white
    content_mask = content_mask & (~is_transparent)

    # ── Step 5: Gaussian-smooth for clean, soft edges ──
    mask_img = Image.fromarray((content_mask.astype(np.uint8) * 255), "L")
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=1.5))
    final = np.array(mask_img) > 120

    return final


def add_golden_border(img, w, h, radius, suit="default"):
    """Draw a luxurious suit-specific cosmic border frame."""
    draw = ImageDraw.Draw(img)
    palette = SUIT_PALETTES.get(suit, SUIT_PALETTES["default"])
    base_color = palette["border"]

    # Outer border
    for i in range(3):
        alpha = 200 - i * 40
        color = (*base_color, alpha)
        draw.rounded_rectangle(
            [(i, i), (w - 1 - i, h - 1 - i)],
            radius=radius - i,
            outline=color,
            width=1
        )

    # Inner decorative line
    inset = 6
    draw.rounded_rectangle(
        [(inset, inset), (w - 1 - inset, h - 1 - inset)],
        radius=radius - inset,
        outline=(*base_color, 80),
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


def create_content_glow(content_mask_uint8, w, h, suit="default"):
    """Create a suit-specific glow effect around the card content."""
    mask_img = Image.fromarray(content_mask_uint8, "L")
    palette = SUIT_PALETTES.get(suit, SUIT_PALETTES["default"])

    # Wide outer glow
    outer_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=8))
    outer_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_color = Image.new("RGBA", (w, h), palette["glow_outer"])
    outer_glow = Image.composite(glow_color, outer_glow, outer_glow_mask)

    # Medium glow
    mid_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=4))
    mid_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mid_color = Image.new("RGBA", (w, h), palette["glow_mid"])
    mid_glow = Image.composite(mid_color, mid_glow, mid_glow_mask)

    # Tight inner glow
    inner_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=2))
    inner_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    inner_color = Image.new("RGBA", (w, h), (255, 255, 255, 90))
    inner_glow = Image.composite(inner_color, inner_glow, inner_glow_mask)

    # Combine all glow layers
    result = Image.alpha_composite(outer_glow, mid_glow)
    result = Image.alpha_composite(result, inner_glow)
    return result


def cosmic_recolor_face_card(content_arr, mask_bool, suit="default"):
    """
    Recolor face card artwork smoothly to avoid banding & broken details.
    Color mapping:
      - Dark outlines (black/gray) transition into Luminous Suit-specific color.
    """
    arr = content_arr.copy().astype(float)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    palette = SUIT_PALETTES.get(suit, SUIT_PALETTES["default"])
    target_r, target_g, target_b = palette["main"]

    # Calculate Luminance
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    # Soft map for dark outlines -> Target Suit Color
    dark_blend = np.clip((100.0 - lum) / 70.0, 0.0, 1.0)
    
    new_r = r + (target_r - r) * dark_blend
    new_g = g + (target_g - g) * dark_blend
    new_b = b + (target_b - b) * dark_blend
    
    # Increase saturation slightly 
    sat_factor = 1.35
    new_lum = 0.299 * new_r + 0.587 * new_g + 0.114 * new_b
    new_r = new_lum + (new_r - new_lum) * sat_factor
    new_g = new_lum + (new_g - new_lum) * sat_factor
    new_b = new_lum + (new_b - new_lum) * sat_factor

    arr[:, :, 0] = np.clip(new_r, 0, 255)
    arr[:, :, 1] = np.clip(new_g, 0, 255)
    arr[:, :, 2] = np.clip(new_b, 0, 255)
    
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def cosmic_tint_content(content_layer, content_mask, bg_cosmic, is_face_card=False, suit="default"):
    """
    Remap card content colors for cosmic theme:
    - Face cards (J, Q, K): recolor based on suit
    - Dark content (spades/clubs) -> White
    - Red content (hearts/diamonds) -> vivid bright red
    """
    w, h = content_layer.size
    content_arr = np.array(content_layer)
    mask_bool = content_mask

    if is_face_card:
        # For face cards, we use the advanced recoloring
        return cosmic_recolor_face_card(content_arr, mask_bool, suit)

    r = content_arr[:, :, 0]
    g = content_arr[:, :, 1]
    b = content_arr[:, :, 2]
    
    # Identify different color regions 
    is_red = (r > 130) & (g < 100) & (b < 100) & mask_bool
    is_dark = (r < 90) & (g < 90) & (b < 90) & mask_bool
    is_white = (r > 180) & (g > 180) & (b > 180) & mask_bool

    result_arr = content_arr.copy()

    # Red content (hearts/diamonds) -> BRIGHT PINK-RED
    if np.any(is_red):
        result_arr[is_red, 0] = 255
        result_arr[is_red, 1] = 40
        result_arr[is_red, 2] = 120
        result_arr[is_red, 3] = 255
        
    # Dark content (spades/clubs & outlines) -> PURE WHITE
    if np.any(is_dark):
        result_arr[is_dark, 0] = 255
        result_arr[is_dark, 1] = 255
        result_arr[is_dark, 2] = 255
        result_arr[is_dark, 3] = 255
        
    # Skin/clothes in JQK handled by recolor_face_card above,
    # but for simple number cards we handle white as transparent
    if np.any(is_white):
        result_arr[is_white, 3] = 0

    return Image.fromarray(result_arr, "RGBA")


def create_face_card_backdrop(w, h, content_mask_uint8):
    """
    Create a semi-transparent frosted panel behind face card art.
    Uses a dark indigo panel with stronger opacity and wider feathering
    for better readability of recolored face card art.
    """
    mask_img = Image.fromarray(content_mask_uint8, "L")

    # Wider dilation for a more generous backdrop
    dilated = mask_img.filter(ImageFilter.MaxFilter(size=9))
    dilated = dilated.filter(ImageFilter.GaussianBlur(radius=8))

    # Semi-transparent dark indigo panel
    backdrop = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dark_panel = Image.new("RGBA", (w, h), (10, 6, 25, 180))
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
    """Apply the cosmic swirl transformation with suit-specific pale colors."""
    original = Image.open(input_path).convert("RGBA")
    w, h = original.size
    fname = os.path.basename(input_path)
    face_card = is_face_card_file(fname)
    
    # Extract suit (e.g., 'S-Q.png' -> 'S')
    suit = "default"
    if "-" in fname:
        suit = fname.split("-")[0]

    # ── 1. Detect content ──
    arr = np.array(original)
    if face_card:
        content_mask = detect_content_mask_face_card(arr)
    else:
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
    cosmic_content = cosmic_tint_content(content_layer, content_mask, cosmic_bg, is_face_card=face_card, suit=suit)

    # ── 5. Create glow behind content ──
    glow = create_content_glow(content_mask_uint8, w, h, suit=suit)

    # ── 6. Sparkle on content ──
    sparkle = add_sparkle_on_content(content_mask_uint8, w, h, density=0.04)

    # ── 7. Compose ──
    result = cosmic_bg.copy()
    result = add_star_sparkles(result, count=60)

    # Face cards get a frosted backdrop panel for readability
    if face_card:
        backdrop = create_face_card_backdrop(w, h, content_mask_uint8)
        result = Image.alpha_composite(result, backdrop)

    result = Image.alpha_composite(result, glow)
    result = Image.alpha_composite(result, cosmic_content)
    result = Image.alpha_composite(result, sparkle)

    # ── 8. Rounded corners ──
    card_mask = rounded_rect_mask(w, h, CORNER_RADIUS)
    result.putalpha(card_mask)

    # ── 9. Suit-specific border ──
    result = add_golden_border(result, w, h, CORNER_RADIUS, suit=suit)

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
