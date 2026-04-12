import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import concurrent.futures
import time

INPUT_DIR = os.path.join("public", "images", "cards", "default")
OUTPUT_DIR = os.path.join("public", "images", "cards", "plasma")
WIDTH, HEIGHT = 226, 314
FRAMES = 24

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Pre-calculate base geometry
y_grid, x_grid = np.indices((HEIGHT, WIDTH))

def create_plasma_frame(t):
    """Generates the animated plasma background for a specific time t in [0, 2pi]."""
    # Create sine waves shifting over time
    wave1 = np.sin(x_grid / 12.0 + y_grid / 30.0 + t)
    wave2 = np.cos(x_grid / 20.0 - y_grid / 45.0 - t * 1.5)
    wave3 = np.sin(-x_grid / 15.0 + y_grid / 20.0 + t * 2.0)
    
    plasma = (wave1 + wave2 + wave3 + 3) / 6.0  # Normalize to [0, 1]
    
    # Map to Colors (Cyan and Magenta)
    # Background is deep blue: R=10, G=15, B=60
    base_color = np.array([10.0, 15.0, 60.0])
    cyan = np.array([0.0, 255.0, 255.0])
    magenta = np.array([255.0, 0.0, 255.0])
    
    # 0.0 -> base, 0.5 -> cyan, 1.0 -> magenta
    # We use some polynomial mapping to make the bright lines sharp
    sharpness = plasma ** 3 
    
    # Color blend
    c_r = base_color[0] + sharpness * (cyan[0]*0.4 + magenta[0]*0.6)
    c_g = base_color[1] + sharpness * (cyan[1]*0.8 + magenta[1]*0.2)
    c_b = base_color[2] + sharpness * (cyan[2]*0.5 + magenta[2]*0.5)
    
    # Boost center vertical area (the "flow")
    center_glow = np.exp(-((x_grid - WIDTH/2) / 40.0)**2) * 80.0
    c_b += center_glow
    c_r += center_glow * 0.5
    
    arr = np.stack([c_r, c_g, c_b], axis=-1)
    return np.clip(arr, 0, 255).astype(np.float32)

def generate_starfield():
    np.random.seed(42)
    noise = np.random.rand(HEIGHT, WIDTH)
    stars = (noise > 0.985) * 200.0  # high threshold
    
    # Convert to image, blur to make them glow slightly
    star_img = Image.fromarray(np.uint8(stars), 'L').filter(ImageFilter.GaussianBlur(1))
    return np.array(star_img, dtype=np.float32)

def process_card(filename):
    out_path = os.path.join(OUTPUT_DIR, filename.replace('.png', '.webp'))
    in_path = os.path.join(INPUT_DIR, filename)
    
    orig = Image.open(in_path).convert('RGBA')
    orig_np = np.array(orig)
    
    # Extract Content Mask (assuming default deck has white background R>200, G>200, B>200)
    white_mask = (orig_np[:,:,0]>200) & (orig_np[:,:,1]>200) & (orig_np[:,:,2]>200)
    alpha_mask = orig_np[:,:,3] > 128
    
    content_mask = (~white_mask) & alpha_mask
    
    # We want to isolate the border vs inner content. 
    # Just assume everything not white is content (since we are drawing completely from scratch over inside)
    # Convert to PIL to do outline glowing
    c_mask_img = Image.fromarray((content_mask * 255).astype(np.uint8), 'L')
    
    # Dilation for double outline glow (Cyan/Purple)
    outline_img = c_mask_img.filter(ImageFilter.MaxFilter(5))
    outline_glow_img = outline_img.filter(ImageFilter.GaussianBlur(3))
    outline_glow_np = np.array(outline_glow_img).astype(np.float32) / 255.0
    
    is_red = filename.startswith('H-') or filename.startswith('D-')
    y_grad = y_grid / HEIGHT
    
    if is_red:
        # Red Suits: Hot Pink / Crimson Glow
        grad_R = np.full((HEIGHT, WIDTH), 255.0, dtype=np.float32)
        grad_G = 50.0 - y_grad * 50.0       # 50 down to 0
        grad_B = 100.0 + y_grad * 100.0     # 100 up to 200 (Crimson to Hot Pink)
        inner_base = np.array([80.0, 0.0, 20.0], dtype=np.float32)
        content_area = np.stack([content_stars * 2.0, content_stars * 0.8, content_stars * 0.8], axis=-1)
    else:
        # Black Suits: Cyan / Light Blue Glow
        grad_R = 0.0 + y_grad * 100.0       # 0 up to 100
        grad_G = 255.0 - y_grad * 50.0      # 255 down to 205
        grad_B = np.full((HEIGHT, WIDTH), 255.0, dtype=np.float32)
        inner_base = np.array([0.0, 15.0, 50.0], dtype=np.float32)
        content_area = np.stack([content_stars * 0.8, content_stars * 1.5, content_stars * 2.5], axis=-1)
    
    outline_color = np.stack([grad_R, grad_G, grad_B], axis=-1)
    glow_layer = outline_color * (outline_glow_np[:, :, None]) * 1.5 # Boost glow intensity
    
    # Create the animated frames
    frames = []
    
    # Pre-build constant layers
    bg_stars = np.stack([generate_starfield() * 0.5]*3, axis=-1)
    
    # Frame Loop
    for frame_idx in range(FRAMES):
        t = (frame_idx / FRAMES) * 2.0 * np.pi
        plasma_bg = create_plasma_frame(t)
        
        # Additive Blending!
        # L1: Plasma + L2: Bg Stars
        composite = plasma_bg + bg_stars
        
        # L4 & L5: Glowing Outline & Content Mini-starfield
        # We replace the content area completely with the starfield
        c_mask_bool = content_mask[:, :, None]
        
        # Add glow around content
        composite = composite + glow_layer
        
        # Override inside content with pure black + bright stars
        # To make it look like "cutting a window into deep space"
        composite = np.where(c_mask_bool, [10.0, 0.0, 30.0] + content_area, composite)
        
        # Corner cropping (Geometry)
        R = 14
        corner_mask = np.ones((HEIGHT, WIDTH), dtype=np.float32)
        # Top-left
        dist_tl = (x_grid - R)**2 + (y_grid - R)**2
        corner_mask[(x_grid < R) & (y_grid < R)] = (dist_tl[(x_grid < R) & (y_grid < R)] <= R**2)
        # Top-right
        dist_tr = (x_grid - (WIDTH-1-R))**2 + (y_grid - R)**2
        corner_mask[(x_grid > WIDTH-1-R) & (y_grid < R)] = (dist_tr[(x_grid > WIDTH-1-R) & (y_grid < R)] <= R**2)
        # Bottom-left
        dist_bl = (x_grid - R)**2 + (y_grid - (HEIGHT-1-R))**2
        corner_mask[(x_grid < R) & (y_grid > HEIGHT-1-R)] = (dist_bl[(x_grid < R) & (y_grid > HEIGHT-1-R)] <= R**2)
        # Bottom-right
        dist_br = (x_grid - (WIDTH-1-R))**2 + (y_grid - (HEIGHT-1-R))**2
        corner_mask[(x_grid > WIDTH-1-R) & (y_grid > HEIGHT-1-R)] = (dist_br[(x_grid > WIDTH-1-R) & (y_grid > HEIGHT-1-R)] <= R**2)
        
        composite = np.clip(composite, 0, 255)
        
        # Add alpha channel
        alpha_channel = (corner_mask * 255).astype(np.uint8)
        alpha_img = Image.fromarray(alpha_channel, 'L')
        final_img = Image.fromarray(composite.astype(np.uint8), 'RGB')
        final_img.putalpha(alpha_img)
        
        # Border Layer: Gothic metal + sparkles
        draw = ImageDraw.Draw(final_img)
        draw.rounded_rectangle([(0,0), (WIDTH-1, HEIGHT-1)], radius=R, outline=(150, 150, 180, 200), width=2)
        draw.rounded_rectangle([(3,3), (WIDTH-4, HEIGHT-4)], radius=R-3, outline=(60, 60, 90, 255), width=1)
        
        frames.append(final_img)
        
    # Save as Animated WebP
    frames[0].save(out_path, format="WEBP", save_all=True, append_images=frames[1:], duration=100, loop=0, method=6, quality=90)
    print(f"Generated {out_path}")

if __name__ == '__main__':
    files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.png')]
    t0 = time.time()
    with concurrent.futures.ProcessPoolExecutor() as executor:
        executor.map(process_card, files)
        
    print(f"Successfully generated animated Plasma Deck ({len(files)} files) in {time.time() - t0:.1f}s")
