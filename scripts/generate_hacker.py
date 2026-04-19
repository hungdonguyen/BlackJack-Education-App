import os
import numpy as np
from PIL import Image, ImageDraw
import concurrent.futures
import time

INPUT_DIR = os.path.join("public", "images", "cards", "default")
OUTPUT_DIR = os.path.join("public", "images", "cards", "hacker")
WIDTH, HEIGHT = 226, 314

os.makedirs(OUTPUT_DIR, exist_ok=True)

y_grid, x_grid = np.indices((HEIGHT, WIDTH))

def process_card(filename):
    in_path = os.path.join(INPUT_DIR, filename)
    out_path = os.path.join(OUTPUT_DIR, filename)
    
    orig = Image.open(in_path).convert('RGBA')
    orig_np = np.array(orig).astype(np.float32) / 255.0
    
    alpha_mask = orig_np[:,:,3] > 0.5
    orig_rgb = orig_np[:,:, :3]
    
    # 1. Base Darkness
    darkness = 1.0 - np.mean(orig_rgb, axis=2)
    
    # Use a softer curve to keep Red suits bright (0.7) while separating from Black (1.0)
    intensity = np.clip((darkness ** 1.3) * 1.3, 0.0, 1.0)
    
    # 2. Extract Ink Alpha (for compositing over magenta)
    # Using darkness directly so we don't punch holes in the shadow
    ink_alpha = np.clip(darkness * 2.0, 0.0, 1.0)
    
    is_red_suit = filename.startswith('H') or filename.startswith('D')
    
    # 3. Create Shadow Layer (Red for Red suits, White/Blue for Black suits)
    shift_x, shift_y = 3, 3
    shadow_alpha = np.roll(ink_alpha, shift=shift_y, axis=0)
    shadow_alpha = np.roll(shadow_alpha, shift=shift_x, axis=1)
    shadow_alpha[:shift_y, :] = 0
    shadow_alpha[:, :shift_x] = 0
    
    final_r = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    final_g = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    final_b = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    
    # Composite Layer 1: Colored Glitch Shadow
    if is_red_suit:
        # Red shadow
        final_r = 1.0 * shadow_alpha
        final_g = 0.0 * shadow_alpha
        final_b = 0.0 * shadow_alpha
    else:
        # Silver/Gray shadow for Black suits (since pure black is invisible)
        final_r = 0.6 * shadow_alpha
        final_g = 0.6 * shadow_alpha
        final_b = 0.6 * shadow_alpha
    
    # Composite Layer 2: Neon Green Ink (R=0, G=intensity, B=0)
    main_g = intensity * 1.0
    
    # Blend over shadow using ink_alpha
    final_r = final_r * (1.0 - ink_alpha)
    final_g = main_g * ink_alpha + final_g * (1.0 - ink_alpha)
    final_b = final_b * (1.0 - ink_alpha)
    
    # SRT Scanlines
    scanline_mask = (y_grid % 4 < 2).astype(np.float32)
    final_r *= (1.0 - scanline_mask * 0.15)
    final_g *= (1.0 - scanline_mask * 0.15)
    final_b *= (1.0 - scanline_mask * 0.15)
    
    final_rgb = np.stack([final_r, final_g, final_b], axis=-1) * 255.0
    final_img = Image.fromarray(np.clip(final_rgb, 0, 255).astype(np.uint8), 'RGB')
    
    draw = ImageDraw.Draw(final_img)
    R = 14
    
    # Border matches suit type for easy distinction in hand
    if is_red_suit:
        border_color = (255, 30, 30)
    else:
        border_color = (150, 150, 150)
        
    draw.rounded_rectangle([(1,1), (WIDTH-2, HEIGHT-2)], radius=R, outline=border_color, width=2)
    
    alpha_img = Image.fromarray((alpha_mask * 255).astype(np.uint8), 'L')
    final_img.putalpha(alpha_img)
    
    final_img.save(out_path, "PNG")

if __name__ == '__main__':
    files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.png')]
    t0 = time.time()
    with concurrent.futures.ProcessPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
        executor.map(process_card, files)
    print(f"Successfully generated Hacker Intensity Balanced Deck ({len(files)} files) in {time.time() - t0:.1f}s")
