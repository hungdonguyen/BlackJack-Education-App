import os
import math
import random
import numpy as np
import concurrent.futures
import time
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

# ─── Configuration ───────────────────────────────────────────────────────────

INPUT_DIR  = os.path.join("public", "images", "cards", "default")
OUTPUT_DIR = os.path.join("public", "images", "cards", "cosmic")
CARD_W, CARD_H = 226, 314
CORNER_RADIUS = 14
FRAMES = 60
DURATION = 100

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


def load_and_prepare_bg_for_rotation(path, w, h):
    """Load a background image and make it a large square for clean rotation."""
    bg = Image.open(path).convert("RGBA")
    diag = int(math.ceil(math.sqrt(w**2 + h**2)))
    # Ensure minimum dimension is diag
    bg_w, bg_h = bg.size
    ratio = max(diag / bg_w, diag / bg_h)
    new_w = int(bg_w * ratio)
    new_h = int(bg_h * ratio)
    bg = bg.resize((new_w, new_h), Image.LANCZOS)
    
    # Crop center to diag x diag
    left = (new_w - diag) // 2
    top = (new_h - diag) // 2
    return bg.crop((left, top, left + diag, top + diag))


def generate_star_layer(w, h, count=80):
    """Generate a transparent layer with stars for parallax rotation."""
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for _ in range(count):
        sx = random.randint(0, w - 1)
        sy = random.randint(0, h - 1)
        brightness = random.randint(180, 255)
        # Random tint
        c_rand = random.random()
        if c_rand < 0.3:
            col = (brightness, brightness, brightness)
        elif c_rand < 0.6:
            col = (brightness, max(0, brightness-30), max(0, brightness-60))
        else:
            col = (max(0, brightness-40), max(0, brightness-20), brightness)
            
        alpha = random.randint(120, 230)
        size_type = random.random()
        
        if size_type < 0.6:
            d.point((sx, sy), fill=(*col, alpha))
        elif size_type < 0.85:
            d.ellipse([(sx-1, sy-1), (sx+1, sy+1)], fill=(*col, alpha))
        else:
            d.point((sx, sy), fill=(*col, alpha))
            d.point((sx-1, sy), fill=(*col, alpha//2))
            d.point((sx+1, sy), fill=(*col, alpha//2))
            d.point((sx, sy-1), fill=(*col, alpha//2))
            d.point((sx, sy+1), fill=(*col, alpha//2))
            
    return overlay


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
    """
    from scipy import ndimage

    r, g, b, a = img_arr[:, :, 0], img_arr[:, :, 1], img_arr[:, :, 2], img_arr[:, :, 3]
    h, w = r.shape

    is_white = (r > 200) & (g > 200) & (b > 200)
    is_transparent = a < 30
    is_colored = (~is_white) & (~is_transparent)

    colored_img = Image.fromarray((is_colored.astype(np.uint8) * 255), "L")
    sealed = colored_img.filter(ImageFilter.MaxFilter(size=7))  
    sealed_bool = np.array(sealed) > 127

    passable = (is_white | is_transparent) & (~sealed_bool)

    margin = 15
    edge_seeds = np.zeros((h, w), dtype=bool)
    edge_seeds[:margin, :] = True
    edge_seeds[-margin:, :] = True
    edge_seeds[:, :margin] = True
    edge_seeds[:, -margin:] = True
    edge_seeds = edge_seeds & passable

    struct = np.ones((3, 3), dtype=int)
    labeled, _ = ndimage.label(passable, structure=struct)

    edge_labels = set(labeled[edge_seeds].flatten())
    edge_labels.discard(0)

    reachable_bg = np.zeros((h, w), dtype=bool)
    for lbl in edge_labels:
        reachable_bg |= (labeled == lbl)

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

    all_bg = reachable_bg | outer_bg

    trapped_white = is_white & (~all_bg) & (~is_transparent)
    content_mask = is_colored | trapped_white
    content_mask = content_mask & (~is_transparent)

    mask_img = Image.fromarray((content_mask.astype(np.uint8) * 255), "L")
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=1.5))
    final = np.array(mask_img) > 120

    return final


def add_golden_border(img, w, h, radius, suit="default"):
    """Draw a luxurious suit-specific cosmic border frame."""
    draw = ImageDraw.Draw(img)
    palette = SUIT_PALETTES.get(suit, SUIT_PALETTES["default"])
    base_color = palette["border"]

    for i in range(3):
        alpha = 200 - i * 40
        color = (*base_color, alpha)
        draw.rounded_rectangle(
            [(i, i), (w - 1 - i, h - 1 - i)],
            radius=radius - i,
            outline=color,
            width=1
        )

    inset = 6
    draw.rounded_rectangle(
        [(inset, inset), (w - 1 - inset, h - 1 - inset)],
        radius=radius - inset,
        outline=(*base_color, 80),
        width=1
    )

    return img


def create_content_glow(content_mask_uint8, w, h, suit="default"):
    """Create a suit-specific glow effect around the card content."""
    mask_img = Image.fromarray(content_mask_uint8, "L")
    palette = SUIT_PALETTES.get(suit, SUIT_PALETTES["default"])

    outer_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=8))
    outer_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_color = Image.new("RGBA", (w, h), palette["glow_outer"])
    outer_glow = Image.composite(glow_color, outer_glow, outer_glow_mask)

    mid_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=4))
    mid_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mid_color = Image.new("RGBA", (w, h), palette["glow_mid"])
    mid_glow = Image.composite(mid_color, mid_glow, mid_glow_mask)

    inner_glow_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=2))
    inner_glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    inner_color = Image.new("RGBA", (w, h), (255, 255, 255, 90))
    inner_glow = Image.composite(inner_color, inner_glow, inner_glow_mask)

    result = Image.alpha_composite(outer_glow, mid_glow)
    result = Image.alpha_composite(result, inner_glow)
    return result


def cosmic_recolor_face_card(content_arr, mask_bool, suit="default"):
    """Recolor face card artwork smoothly to avoid banding & broken details."""
    arr = content_arr.copy().astype(float)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    palette = SUIT_PALETTES.get(suit, SUIT_PALETTES["default"])
    target_r, target_g, target_b = palette["main"]

    lum = 0.299 * r + 0.587 * g + 0.114 * b

    dark_blend = np.clip((100.0 - lum) / 70.0, 0.0, 1.0)
    
    new_r = r + (target_r - r) * dark_blend
    new_g = g + (target_g - g) * dark_blend
    new_b = b + (target_b - b) * dark_blend
    
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
    """Remap card content colors for cosmic theme."""
    w, h = content_layer.size
    content_arr = np.array(content_layer)
    mask_bool = content_mask

    if is_face_card:
        return cosmic_recolor_face_card(content_arr, mask_bool, suit)

    r = content_arr[:, :, 0]
    g = content_arr[:, :, 1]
    b = content_arr[:, :, 2]
    
    is_red = (r > 130) & (g < 100) & (b < 100) & mask_bool
    is_dark = (r < 90) & (g < 90) & (b < 90) & mask_bool
    is_white = (r > 180) & (g > 180) & (b > 180) & mask_bool

    result_arr = content_arr.copy()

    if np.any(is_red):
        result_arr[is_red, 0] = 255
        result_arr[is_red, 1] = 40
        result_arr[is_red, 2] = 120
        result_arr[is_red, 3] = 255
        
    if np.any(is_dark):
        result_arr[is_dark, 0] = 255
        result_arr[is_dark, 1] = 255
        result_arr[is_dark, 2] = 255
        result_arr[is_dark, 3] = 255
        
    if np.any(is_white):
        result_arr[is_white, 3] = 0

    return Image.fromarray(result_arr, "RGBA")


def create_face_card_backdrop(w, h, content_mask_uint8):
    """Create a semi-transparent frosted panel behind face card art."""
    mask_img = Image.fromarray(content_mask_uint8, "L")

    dilated = mask_img.filter(ImageFilter.MaxFilter(size=9))
    dilated = dilated.filter(ImageFilter.GaussianBlur(radius=8))

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
            col = (255, 230, 150)  
        elif choice < 0.85:
            col = (180, 200, 255)  
        else:
            col = (255, 180, 220)  

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


def process_card(args):
    input_path, bg_images = args
    fname = os.path.basename(input_path)
    output_path = os.path.join(OUTPUT_DIR, fname.replace(".png", ".webp"))
    
    original = Image.open(input_path).convert("RGBA")
    w, h = original.size
    face_card = is_face_card_file(fname)
    
    suit = "default"
    if "-" in fname:
        suit = fname.split("-")[0]

    arr = np.array(original)
    if face_card:
        content_mask = detect_content_mask_face_card(arr)
    else:
        content_mask = detect_content_mask(arr)
    content_mask_uint8 = (content_mask.astype(np.uint8)) * 255

    content_rgba = arr.copy()
    content_rgba[~content_mask] = [0, 0, 0, 0]
    content_layer = Image.fromarray(content_rgba, "RGBA")

    # Prepare background layer (make a large square so we can rotate without black edges)
    bg_path = random.choice(bg_images)
    cosmic_bg_large = load_and_prepare_bg_for_rotation(bg_path, w, h)
    cosmic_bg_large = ImageEnhance.Brightness(cosmic_bg_large).enhance(0.85)

    diag = cosmic_bg_large.size[0]
    left = (diag - w) // 2
    top = (diag - h) // 2
    cosmic_bg_static = cosmic_bg_large.crop((left, top, left + w, top + h))

    cosmic_content = cosmic_tint_content(content_layer, content_mask, cosmic_bg_static, is_face_card=face_card, suit=suit)
    glow = create_content_glow(content_mask_uint8, w, h, suit=suit)
    sparkle = add_sparkle_on_content(content_mask_uint8, w, h, density=0.04)

    backdrop = None
    if face_card:
        backdrop = create_face_card_backdrop(w, h, content_mask_uint8)

    card_mask = rounded_rect_mask(w, h, CORNER_RADIUS)

    # Pre-generate swirling star layers
    stars1_large = generate_star_layer(diag, diag, count=120)
    stars2_large = generate_star_layer(diag, diag, count=60)

    frames = []
    
    total_time = (FRAMES * DURATION) / 1000.0  # seconds
    rpm = 1.0  # 1 RPM = 360 degrees per 60 seconds
    rot_per_loop = (360.0 * rpm / 60.0) * total_time

    for i in range(FRAMES):
        t = i / float(FRAMES)
        
        # Layer 1 fades out, Layer 2 fades in over the loop to create a seamless rotation
        angle1 = t * rot_per_loop
        angle2 = angle1 - rot_per_loop
        
        # Rotate bg and stars using negative angle for counter-clockwise swirl
        bg_rot1 = cosmic_bg_large.rotate(-angle1, resample=Image.BICUBIC).crop((left, top, left + w, top + h))
        bg_rot2 = cosmic_bg_large.rotate(-angle2, resample=Image.BICUBIC).crop((left, top, left + w, top + h))
        frame_bg = Image.blend(bg_rot1, bg_rot2, t)
        
        # Parallax effect: stars rotate at different speeds
        s1_rot1 = stars1_large.rotate(-angle1 * 1.5, resample=Image.BICUBIC).crop((left, top, left + w, top + h))
        s1_rot2 = stars1_large.rotate(-angle2 * 1.5, resample=Image.BICUBIC).crop((left, top, left + w, top + h))
        s1_frame = Image.blend(s1_rot1, s1_rot2, t)
        
        s2_rot1 = stars2_large.rotate(-angle1 * 2.0, resample=Image.BICUBIC).crop((left, top, left + w, top + h))
        s2_rot2 = stars2_large.rotate(-angle2 * 2.0, resample=Image.BICUBIC).crop((left, top, left + w, top + h))
        s2_frame = Image.blend(s2_rot1, s2_rot2, t)
        
        result = Image.alpha_composite(frame_bg, s1_frame)
        result = Image.alpha_composite(result, s2_frame)
        
        if face_card and backdrop:
            result = Image.alpha_composite(result, backdrop)
            
        result = Image.alpha_composite(result, glow)
        result = Image.alpha_composite(result, cosmic_content)
        result = Image.alpha_composite(result, sparkle)
        
        result.putalpha(card_mask)
        result = add_golden_border(result, w, h, CORNER_RADIUS, suit=suit)
        
        frames.append(result)

    frames[0].save(output_path, format="WEBP", save_all=True, append_images=frames[1:], duration=DURATION, loop=0, method=6, quality=90)
    return output_path


def process_card_back_task(args):
    input_path, card_back_path, bg_images = args
    output_path = os.path.join(OUTPUT_DIR, "card-back.webp")
    w, h = CARD_W, CARD_H
    
    if card_back_path:
        cosmic_bg_large = load_and_prepare_bg_for_rotation(card_back_path, w, h)
    else:
        cosmic_bg_large = load_and_prepare_bg_for_rotation(bg_images[0], w, h)
        cosmic_bg_large = ImageEnhance.Brightness(cosmic_bg_large).enhance(0.7)

    diag = cosmic_bg_large.size[0]
    left = (diag - w) // 2
    top = (diag - h) // 2
    
    stars1_large = generate_star_layer(diag, diag, count=200)
    stars2_large = generate_star_layer(diag, diag, count=100)
    
    card_mask = rounded_rect_mask(w, h, CORNER_RADIUS)
    
    # Static card back without rotation
    frame_bg = cosmic_bg_large.crop((left, top, left + w, top + h))
    s1_frame = stars1_large.crop((left, top, left + w, top + h))
    s2_frame = stars2_large.crop((left, top, left + w, top + h))
    
    result = Image.alpha_composite(frame_bg, s1_frame)
    result = Image.alpha_composite(result, s2_frame)
    
    result.putalpha(card_mask)
    result = add_golden_border(result, w, h, CORNER_RADIUS)

    result.save(output_path, format="WEBP", quality=90)
    return output_path


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    bg_images = find_bg_images()
    card_back_path = find_card_back_bg()
    # files = sorted(f for f in os.listdir(INPUT_DIR) if f.endswith(".png"))
    files = ["S-A.png"]
    
    tasks = []
    back_task = None
    for fname in files:
        input_path = os.path.join(INPUT_DIR, fname)
        if fname == "card-back.png":
            back_task = (input_path, card_back_path, bg_images)
        else:
            tasks.append((input_path, bg_images))

    total = len(files)
    print(f"\n[*] Cosmic Swirl v2 (Animated WebP) - processing {total} cards ...\n")

    t0 = time.time()
    
    with concurrent.futures.ProcessPoolExecutor() as executor:
        futures = []
        if back_task:
            futures.append(executor.submit(process_card_back_task, back_task))
        for t in tasks:
            futures.append(executor.submit(process_card, t))
            
        count = 0
        for future in concurrent.futures.as_completed(futures):
            try:
                res = future.result()
                count += 1
                print(f"  [{count:2d}/{total}] Finished {os.path.basename(res)}")
            except Exception as e:
                print(f"Error processing card: {e}")

    print(f"\n[OK] Done! {total} animated cosmic cards saved in {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
