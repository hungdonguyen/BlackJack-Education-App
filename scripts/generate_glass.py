import os
import numpy as np
from PIL import Image, ImageDraw
import concurrent.futures
import time

INPUT_DIR = os.path.join("public", "images", "cards", "default")
OUTPUT_DIR = os.path.join("public", "images", "cards", "glass")
WIDTH, HEIGHT = 226, 314

os.makedirs(OUTPUT_DIR, exist_ok=True)

y_grid, x_grid = np.indices((HEIGHT, WIDTH))

def process_card(filename):
    in_path = os.path.join(INPUT_DIR, filename)
    out_path = os.path.join(OUTPUT_DIR, filename)
    
    orig = Image.open(in_path).convert('RGBA')
    orig_np = np.array(orig).astype(np.float32) / 255.0
    
    card_mask = orig_np[:,:,3] > 0.5
    orig_rgb = orig_np[:,:, :3]
    
    # Extract ink alpha
    ink_level = 1.0 - np.min(orig_rgb, axis=2)
    ink_alpha = np.clip(ink_level * 5.0, 0.0, 1.0)
    
    # 1. Base Background (Opaque Icy Cyan)
    final_r = np.full((HEIGHT, WIDTH), 150.0 / 255.0)
    final_g = np.full((HEIGHT, WIDTH), 210.0 / 255.0)
    final_b = np.full((HEIGHT, WIDTH), 230.0 / 255.0)
    final_a = np.ones((HEIGHT, WIDTH), dtype=np.float32) # Opaque base!
    
    # 2. Solid Teal Drop Shadow
    shift_x, shift_y = 6, 6
    shadow_mask = np.roll(ink_alpha, shift=shift_y, axis=0)
    shadow_mask = np.roll(shadow_mask, shift=shift_x, axis=1)
    shadow_mask[:shift_y, :] = 0
    shadow_mask[:, :shift_x] = 0
    
    # Teal color: (30, 140, 157)
    shadow_r, shadow_g, shadow_b = 30./255., 140./255., 157./255.
    
    # Composite shadow onto transparent background using Alpha Blending
    # Source = Shadow, Dest = Final
    shadow_alpha_layer = shadow_mask * 0.9 # 90% opacity for shadow
    
    # out_alpha = src_a + dst_a * (1 - src_a)
    new_a = shadow_alpha_layer + final_a * (1.0 - shadow_alpha_layer)
    # protect div by zero
    safe_a = np.where(new_a == 0, 1.0, new_a)
    
    final_r = (shadow_r * shadow_alpha_layer + final_r * final_a * (1.0 - shadow_alpha_layer)) / safe_a
    final_g = (shadow_g * shadow_alpha_layer + final_g * final_a * (1.0 - shadow_alpha_layer)) / safe_a
    final_b = (shadow_b * shadow_alpha_layer + final_b * final_a * (1.0 - shadow_alpha_layer)) / safe_a
    final_a = new_a
    
    # 3. Draw Ink
    ink_a_layer = ink_alpha
    new_a = ink_a_layer + final_a * (1.0 - ink_a_layer)
    safe_a = np.where(new_a == 0, 1.0, new_a)
    
    final_r = (orig_rgb[:,:,0] * ink_a_layer + final_r * final_a * (1.0 - ink_a_layer)) / safe_a
    final_g = (orig_rgb[:,:,1] * ink_a_layer + final_g * final_a * (1.0 - ink_a_layer)) / safe_a
    final_b = (orig_rgb[:,:,2] * ink_a_layer + final_b * final_a * (1.0 - ink_a_layer)) / safe_a
    final_a = new_a
    
    # 4. Diagonal Glare Stripes ON TOP of everything
    diag_pos = (x_grid + y_grid * 0.8)
    stripe_mask = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    s1 = (diag_pos > 80) & (diag_pos < 120)
    s2 = (diag_pos > 180) & (diag_pos < 240)
    s3 = (diag_pos > 300) & (diag_pos < 315)
    s4 = (diag_pos > 380) & (diag_pos < 440)
    
    stripe_mask[s1 | s2 | s3 | s4] = 0.4 # 40% opacity
    glare_r, glare_g, glare_b = 160.0/255.0, 220.0/255.0, 240.0/255.0 # Light Cyan
    
    stripe_a_layer = stripe_mask
    new_a = stripe_a_layer + final_a * (1.0 - stripe_a_layer)
    safe_a = np.where(new_a == 0, 1.0, new_a)
    
    final_r = (glare_r * stripe_a_layer + final_r * final_a * (1.0 - stripe_a_layer)) / safe_a
    final_g = (glare_g * stripe_a_layer + final_g * final_a * (1.0 - stripe_a_layer)) / safe_a
    final_b = (glare_b * stripe_a_layer + final_b * final_a * (1.0 - stripe_a_layer)) / safe_a
    final_a = new_a
    
    # Final clamping and rounding
    final_a[~card_mask] = 0
    
    final_rgb = np.stack([final_r, final_g, final_b], axis=-1) * 255.0
    final_rgb = np.clip(final_rgb, 0, 255).astype(np.uint8)
    
    final_img = Image.fromarray(final_rgb, 'RGB')
    
    final_a_img = Image.fromarray(np.clip(final_a * 255, 0, 255).astype(np.uint8), 'L')
    final_img.putalpha(final_a_img)
    
    # Draw Cyan border
    draw = ImageDraw.Draw(final_img)
    R = 14
    draw.rounded_rectangle([(1,1), (WIDTH-2, HEIGHT-2)], radius=R, outline=(140, 200, 220, 255), width=3)
    
    # Restrict to true rounded corners completely
    alpha_np = np.array(final_img.split()[3])
    alpha_np[~card_mask] = 0
    final_img.putalpha(Image.fromarray(alpha_np))
    
    final_img.save(out_path, "PNG")

if __name__ == '__main__':
    files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.png')]
    t0 = time.time()
    with concurrent.futures.ProcessPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
        executor.map(process_card, files)
    print(f"Successfully generated Glass Vector Transparent Deck ({len(files)} files) in {time.time() - t0:.1f}s")
