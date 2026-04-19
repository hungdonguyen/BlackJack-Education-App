import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import concurrent.futures
import time

INPUT_DIR = os.path.join("public", "images", "cards", "default")
OUTPUT_DIR = os.path.join("public", "images", "cards", "rainbow")
WIDTH, HEIGHT = 226, 314
# Tăng số khung hình và thời gian lưu để animation mượt mà và chậm rải hơn, đỡ chóng mặt
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
for i in range(num_orbs):
    cx = np.random.rand() * WIDTH
    cy = np.random.rand() * HEIGHT
    r = np.random.rand() * 10 + 4
    phase = np.random.rand() * np.pi * 2
    orb_bases.append((cx, cy, r, phase))

def render_orbs(t):
    canvas = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    for cx, cy, r, phase in orb_bases:
        # Nhịp độ di chuyển chậm lại thành dao động nhẹ theo hình tròn
        c_x = cx + np.sin(t + phase) * 8.0 
        c_y = cy + np.cos(t + phase) * 8.0
        
        dist = np.sqrt((x_grid - c_x)**2 + (y_grid - c_y)**2)
        intensity = np.clip(1.0 - dist / r, 0, 1)
        pulse = (np.sin(t + phase) * 0.3 + 0.7)
        canvas += (intensity ** 2.0) * pulse
    return np.clip(canvas, 0, 1) * 255.0

def offset_mask(mask, dx, dy):
    shifted = np.zeros_like(mask)
    y1_s = max(0, dy); y2_s = min(HEIGHT, HEIGHT + dy)
    y1_m = max(0, -dy); y2_m = min(HEIGHT, HEIGHT - dy)
    x1_s = max(0, dx); x2_s = min(WIDTH, WIDTH + dx)
    x1_m = max(0, -dx); x2_m = min(WIDTH, WIDTH - dx)
    shifted[y1_s:y2_s, x1_s:x2_s] = mask[y1_m:y2_m, x1_m:x2_m]
    return shifted

def process_card(filename):
    out_path = os.path.join(OUTPUT_DIR, filename.replace('.png', '.webp'))
    in_path = os.path.join(INPUT_DIR, filename)
    orig = Image.open(in_path).convert('RGBA')
    orig_np = np.array(orig)
    
    white_mask = (orig_np[:,:,0]>200) & (orig_np[:,:,1]>200) & (orig_np[:,:,2]>200)
    alpha_mask = orig_np[:,:,3] > 128
    
    content_mask = (~white_mask) & alpha_mask
    
    # Glow mask for dark drop shadow
    c_mask_img = Image.fromarray((content_mask * 255).astype(np.uint8), 'L')
    glow_img = c_mask_img.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(3))
    glow_np = (np.array(glow_img).astype(np.float32) / 255.0)
    # Mask out the content itself so shadow is only outside
    glow_np[content_mask] = 0.0
    
    mask_cyan    = offset_mask(content_mask,  3,  3) & (~content_mask)
    mask_magenta = offset_mask(content_mask, -3, -1) & (~content_mask)
    mask_yellow  = offset_mask(content_mask, -1,  3) & (~content_mask)
    
    frames = []

    for frame_idx in range(FRAMES):
        t = (frame_idx / FRAMES) * 2.0 * np.pi
        
        # 1. Pastel Holo Bg
        # Giảm tốc độ wave (t * 1 thay vì t * 2) để mềm mại chậm rải hơn, tránh giật lag não
        wave = np.sin((x_grid*2 + y_grid) / 80.0 - t) * 0.5 + 0.5
        hue = (t / (2*np.pi) + wave * 0.3) % 1.0
        
        sat = np.full((HEIGHT, WIDTH), 0.15, dtype=np.float32)
        val = np.full((HEIGHT, WIDTH), 1.0, dtype=np.float32)
        bg_rgb = hsv_to_rgb(hue, sat, val)
        
        scanlines = (y_grid % 4 < 2).astype(np.float32)
        bg_rgb -= scanlines[:, :, None] * 10.0 # Giảm độ tương phản scanline để bớt vằn vện
        
        orbs_layer = render_orbs(t)[:, :, None]
        bg_rgb = np.clip(bg_rgb + orbs_layer, 0, 255)
        
        # 2. Chromatic aberration shadows
        bg_r = bg_rgb[:,:,0]; bg_g = bg_rgb[:,:,1]; bg_b = bg_rgb[:,:,2]
        
        bg_r[mask_cyan] = 0; bg_g[mask_cyan] = 230; bg_b[mask_cyan] = 255
        bg_r[mask_magenta] = 255; bg_g[mask_magenta] = 0; bg_b[mask_magenta] = 240
        bg_r[mask_yellow] = 255; bg_g[mask_yellow] = 240; bg_b[mask_yellow] = 0
        
        # 3. Sử dụng màu sắc gốc (Original Shape/Color) & Đổ bóng
        # Để lá bài có chiều sâu, tạo đổ bóng (drop shadow) mờ dưới các chất bài
        # Tạo hiệu ứng Shadow đen lót dưới
        bg_r = bg_r * (1.0 - glow_np * 0.6)
        bg_g = bg_g * (1.0 - glow_np * 0.6)
        bg_b = bg_b * (1.0 - glow_np * 0.6)
        
        # Áp dụng màu gốc của chất bài & hình JQK nhưng phủ thêm lớp rainbow lướt qua (gliding sheen)
        orig_r = orig_np[:,:,0].astype(np.float32)
        orig_g = orig_np[:,:,1].astype(np.float32)
        orig_b = orig_np[:,:,2].astype(np.float32)
        
        # Tính toán lớp màu rainbow dạt dào
        vivid_hue = ((x_grid*1.5 + y_grid) / 100.0 - (t / (2*np.pi))) % 1.0
        vivid_rgb = hsv_to_rgb(vivid_hue, np.full((HEIGHT, WIDTH), 1.0, dtype=np.float32), np.full((HEIGHT, WIDTH), 1.0, dtype=np.float32))
        
        # Sóng lướt (Sweep wave) chéo qua lá bài để tạo cảm giác ánh sáng lướt qua
        sweep_wave = (np.sin((x_grid - y_grid) / 30.0 - t * 4.0) + 1.0) / 2.0
        sweep_wave = sweep_wave ** 4.0 # Thu hẹp sóng để tạo vệt lướt rõ ràng
        
        # Blend factor: nền chỉ ám nhẹ 15% rainbow, khi vệt sóng đi qua đẩy lên 60% rainbow
        blend_factor = 0.15 + sweep_wave * 0.45
        
        orig_r_content = orig_r[content_mask]
        orig_g_content = orig_g[content_mask]
        orig_b_content = orig_b[content_mask]
        
        v_r_content = vivid_rgb[:,:,0][content_mask]
        v_g_content = vivid_rgb[:,:,1][content_mask]
        v_b_content = vivid_rgb[:,:,2][content_mask]
        
        bf = blend_factor[content_mask]
        
        # Pha trộn giữa màu gốc và màu rainbow theo chỉ số blend_factor, boost x1.1 để giữ độ sáng rực
        bg_r[content_mask] = (orig_r_content * (1.0 - bf) + v_r_content * bf) * 1.1
        bg_g[content_mask] = (orig_g_content * (1.0 - bf) + v_g_content * bf) * 1.1
        bg_b[content_mask] = (orig_b_content * (1.0 - bf) + v_b_content * bf) * 1.1
        
        composite = np.stack([bg_r, bg_g, bg_b], axis=-1)
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
        
    # Thời lượng mỗi frame = 120ms => Khoảng 8.3 fps. 36 frames = chu kỳ 4.3 giây cực chậm và chill
    frames[0].save(out_path, format="WEBP", save_all=True, append_images=frames[1:], duration=120, loop=0, method=6, quality=90)
    print(f"Generated {out_path} (smooth)")

if __name__ == '__main__':
    files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.png')]
    t0 = time.time()
    with concurrent.futures.ProcessPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
        executor.map(process_card, files)
    print(f"Successfully generated animated Rainbow Deck v3 ({len(files)} files) in {time.time() - t0:.1f}s")
