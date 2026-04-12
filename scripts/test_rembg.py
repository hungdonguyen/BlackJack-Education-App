"""Test rembg on a face card."""
import os, sys
from PIL import Image
import rembg

project_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
os.chdir(project_root)

input_path = "public/images/cards/default/H-J.png"
output_path = "scripts/debug_masks/H-J_rembg.png"

# Read original
original = Image.open(input_path).convert("RGBA")

# Remove background
# rembg expects a PIL Image or numpy array
subject = rembg.remove(original, post_process_mask=True, alpha_matting=True)

os.makedirs("scripts/debug_masks", exist_ok=True)
subject.save(output_path)
print(f"Saved to {output_path}")
