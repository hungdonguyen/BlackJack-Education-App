import os
import numpy as np
from PIL import Image, ImageDraw
import concurrent.futures
import time

INPUT_DIR = os.path.join("public", "images", "cards", "default")
OUTPUT_DIR = os.path.join("public", "images", "cards", "rainbow")
WIDTH, HEIGHT = 226, 314
FRAMES = 36

os.makedirs(OUTPUT_DIR, exist_ok=True)

y_grid, x_grid = np.indices((HEIGHT, WIDTH))

def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6.0).astype(int)
    f = (h * 6.0) - i
    p = v * (1.0 - s)
    q = v * (1.0 - s * f)
    t_v = v * (1.0 - s * (1.0 - f))
    
    i = i % 6
    idx = i == 0; r = np.zeros_like(h); g = np.zeros_like(h); b = np.zeros_like(h)
    
    r[idx] = v[idx]; g[idx] = t_v[idx]; b[idx] = p[idx]
    idx = i == 1
    r[idx] = q[idx]; g[idx] = v[idx]; b[idx] = p[idx]
    idx = i == 2
    r[idx] = p[idx]; g[idx] = v[idx]; b[idx] = t_v[idx]
    idx = i == 3
    r[idx] = p[idx]; g[idx] = q[idx]; b[idx] = v[idx]
    idx = i == 4
    r[idx] = t_v[idx]; g[idx] = p[idx]; b[idx] = v[idx]
    idx = i == 5
    r[idx] = v[idx]; g[idx] = p[idx]; b[idx] = q[idx]
    
    return np.stack([r * 255.0, g * 255.0, b * 255.0], axis=-1)

# Pre-calculate orbs
np.random.seed(123)
num_orbs = 18
orb_bases = []
for _ in range(num_orbs):
    cx = np.random.rand() * WIDTH
    cy = np.random.rand() * HEIGHT
    r = np.random.rand() * 10 + 4
    phase = np.random.rand() * np.pi * 2
    orb_bases.append((cx, cy, r, phase))

def render_orbs(t):
    canvas = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    for cx, cy, r, phase in orb_bases:
        c_x = cx + np.sin(t + phase) * 8.0 
        c_y = cy + np.cos(t + phase) * 8.0
        
        dist = np.sqrt((x_grid - c_x)**2 + (y_grid - c_y)**2)
        intensity = np.clip(1.0 - dist / r, 0, 1)
        pulse = (np.sin(t + phase) * 0.3 + 0.7)
        canvas += (intensity ** 2.0) * pulse
    return np.clip(canvas, 0, 1) * 255.0

def process_card(filename):
    out_path = os.path.join(OUTPUT_DIR, filename.replace('.png', '.webp'))
    in_path = os.path.join(INPUT_DIR, filename)
    orig = Image.open(in_path).convert('RGBA')
    orig_np = np.array(orig).astype(np.float32)
    
    alpha_mask = orig_np[:,:,3] > 128
    orig_rgb = orig_np[:,:, :3]
    
    # Calculate darkness to apply sheen only on content
    # Standard grayscale weighting
    darkness = 1.0 - (orig_rgb[:,:,0]*0.299 + orig_rgb[:,:,1]*0.587 + orig_rgb[:,:,2]*0.114) / 255.0
    # Boost darkness slightly so red suits also get good sheen
    darkness = np.clip(darkness * 1.5, 0, 1)
    
    frames = []

    for frame_idx in range(FRAMES):
        t = (frame_idx / FRAMES) * 2.0 * np.pi
        
        # 1. Pastel Holo Bg
        wave = np.sin((x_grid*2 + y_grid) / 80.0 - t) * 0.5 + 0.5
        hue = (t / (2*np.pi) + wave * 0.3) % 1.0
        
        sat = np.full((HEIGHT, WIDTH), 0.15, dtype=np.float32)
        val = np.full((HEIGHT, WIDTH), 1.0, dtype=np.float32)
        bg_rgb = hsv_to_rgb(hue, sat, val)
        
        scanlines = (y_grid % 4 < 2).astype(np.float32)
        bg_rgb -= scanlines[:, :, None] * 10.0
        
        orbs_layer = render_orbs(t)[:, :, None]
        bg_rgb = np.clip(bg_rgb + orbs_layer, 0, 255)
        
        # 2. Multiply Blend Original Content
        # Mutiplies the background with the original image, perfectly preserving all anti-aliased edges and lines.
        # It removes the need for jagged boolean masks and sloppy drop shadows which caused blurriness.
        composite = (bg_rgb * orig_rgb) / 255.0
        
        # 3. Gliding Vivid Rainbow Sheen (Lướt qua)
        vivid_hue = ((x_grid*1.5 + y_grid) / 100.0 - (t / (2*np.pi))) % 1.0
        vivid_rgb = hsv_to_rgb(vivid_hue, np.full((HEIGHT, WIDTH), 1.0, dtype=np.float32), np.full((HEIGHT, WIDTH), 1.0, dtype=np.float32))
        
        sweep_wave = (np.sin((x_grid - y_grid) / 30.0 - t * 4.0) + 1.0) / 2.0
        sweep_wave = sweep_wave ** 4.0 
        
        # Additive blending for the sheen, masked by darkness (only on text/suits)
        sheen = vivid_rgb * sweep_wave[:, :, None] * darkness[:, :, None] * 0.8
        composite = composite + sheen
        
        composite = np.clip(composite, 0, 255)
        composite = np.where(alpha_mask[:, :, None], composite, [0,0,0])
        
        R = 14
        corner_mask = np.ones((HEIGHT, WIDTH), dtype=np.float32)
        dist_tl = (x_grid - R)**2 + (y_grid - R)**2
        corner_mask[(x_grid < R) & (y_grid < R)] = (dist_tl[(x_grid < R) & (y_grid < R)] <= R**2)
        dist_tr = (x_grid - (WIDTH-1-R))**2 + (y_grid - R)**2
        corner_mask[(x_grid > WIDTH-1-R) & (y_grid < R)] = (dist_tr[(x_grid > WIDTH-1-R) & (y_grid < R)] <= R**2)
        dist_bl = (x_grid - R)**2 + (y_grid - (HEIGHT-1-R))**2
        corner_mask[(x_grid < R) & (y_grid > HEIGHT-1-R)] = (dist_bl[(x_grid < R) & (y_grid > HEIGHT-1-R)] <= R**2)
        dist_br = (x_grid - (WIDTH-1-R))**2 + (y_grid - (HEIGHT-1-R))**2
        corner_mask[(x_grid > WIDTH-1-R) & (y_grid > HEIGHT-1-R)] = (dist_br[(x_grid > WIDTH-1-R) & (y_grid > HEIGHT-1-R)] <= R**2)
        
        final_alpha = (alpha_mask & corner_mask.astype(bool))
        
        final_img = Image.fromarray(np.clip(composite, 0, 255).astype(np.uint8), 'RGB')
        alpha_img = Image.fromarray((final_alpha * 255).astype(np.uint8), 'L')
        final_img.putalpha(alpha_img)
        
        draw = ImageDraw.Draw(final_img)
        border_r = 230 + int(20*np.sin(t))
        border_g = 180 + int(20*np.sin(t + 2))
        border_b = 250
        draw.rounded_rectangle([(0,0), (WIDTH-1, HEIGHT-1)], radius=R, outline=(255,255,255,180), width=1)
        draw.rounded_rectangle([(1,1), (WIDTH-2, HEIGHT-2)], radius=R-1, outline=(border_r, border_g, border_b, 255), width=2)
        
        frames.append(final_img)
        
    frames[0].save(out_path, format="WEBP", save_all=True, append_images=frames[1:], duration=120, loop=0, method=6, quality=95)
    print(f"Generated {out_path} (crisp & perfect AA)")

if __name__ == '__main__':
    files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.png')]
    t0 = time.time()
    with concurrent.futures.ProcessPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
        executor.map(process_card, files)
    print(f"Successfully generated animated Rainbow Deck v4 Crisp ({len(files)} files) in {time.time() - t0:.1f}s")
