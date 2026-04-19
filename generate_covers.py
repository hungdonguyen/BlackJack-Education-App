from PIL import Image, ImageChops, ImageDraw

def create_cover(target_path, width, height, logo_scale_pct):
    # Load and trim icon
    icon = Image.open("src-tauri/icons/icon.png").convert("RGBA")
    bg = Image.new("RGBA", icon.size, (0,0,0,0))
    diff = ImageChops.difference(icon, bg)
    bbox = diff.getbbox()
    if bbox:
        icon = icon.crop(bbox)
    
    # Create background gradient (dark blue)
    base = Image.new("RGB", (width, height), (0, 0, 26))
    top_color = (0, 0, 51)
    bottom_color = (0, 0, 26)
    
    # Efficient gradient creation
    gradient = Image.new('L', (1, 256))
    for i in range(256):
        gradient.putpixel((0, i), i)
    gradient = gradient.resize((width, height))
    
    # Manual gradient blend since we have complex logic
    for y in range(height):
        ratio = y / height
        r = int(top_color[0] + (bottom_color[0] - top_color[0]) * ratio)
        g = int(top_color[1] + (bottom_color[1] - top_color[1]) * ratio)
        b = int(top_color[2] + (bottom_color[2] - top_color[2]) * ratio)
        for x in range(width):
            base.putpixel((x, y), (r, g, b))

    # Resize icon
    target_logo_width = int(width * logo_scale_pct)
    aspect = icon.height / icon.width
    target_logo_height = int(target_logo_width * aspect)
    icon_resized = icon.resize((target_logo_width, target_logo_height), Image.Resampling.LANCZOS)
    
    # Subtle drop shadow (soften it slightly)
    # Using a slightly offset black version with transparency
    shadow_offset = (int(width*0.008), int(width*0.008))
    shadow_layer = Image.new("RGBA", (width, height), (0,0,0,0))
    shadow_mask = icon_resized.split()[3]
    
    # Darker shadow
    shadow_pos = ((width - target_logo_width) // 2 + shadow_offset[0], (height - target_logo_height) // 2 + shadow_offset[1])
    shadow_layer.paste((0, 0, 0, 150), shadow_pos, mask=shadow_mask)
    
    # Composite
    base = base.convert("RGBA")
    final = Image.alpha_composite(base, shadow_layer)
    icon_pos = ((width - target_logo_width) // 2, (height - target_logo_height) // 2)
    final.paste(icon_resized, icon_pos, mask=icon_resized)
    
    final.convert("RGB").save(target_path, "PNG")
    import os
    size = os.path.getsize(target_path)
    print(f"{target_path}: {width}x{height}, {size} bytes")

import os
os.makedirs("marketing/itch-assets", exist_ok=True)
create_cover("marketing/itch-assets/cover-630x500-tight.png", 630, 500, 0.82)
create_cover("marketing/itch-assets/cover-630x500-tight-max.png", 630, 500, 0.90)
create_cover("marketing/itch-assets/cover-1260x1000-tight.png", 1260, 1000, 0.82)
