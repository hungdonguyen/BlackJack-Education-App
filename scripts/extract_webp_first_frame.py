import os
from PIL import Image

def convert_dir(path):
    if not os.path.exists(path): return
    for f in os.listdir(path):
        if f.endswith(".webp"):
            img = Image.open(os.path.join(path, f))
            img.seek(0)
            img.save(os.path.join(path, f.replace(".webp", ".png")), "PNG")
            print(f"Saved {f.replace('.webp', '.png')} in {path}")

convert_dir(os.path.join("public", "images", "cards", "plasma"))
convert_dir(os.path.join("public", "images", "cards", "cosmic"))
