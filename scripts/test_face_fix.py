"""Re-process face cards one by one with sealed-outline flood-fill."""
import os, sys
project_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
os.chdir(project_root)
sys.path.insert(0, project_root)

from scripts.cosmic_swirl import process_card, find_bg_images, OUTPUT_DIR, INPUT_DIR

bg_images = find_bg_images()
face_files = sorted(
    f for f in os.listdir(INPUT_DIR)
    if f.endswith(".png") and any(f.endswith(f"-{r}.png") for r in ["J", "Q", "K"])
)
print(f"\n[*] Re-processing {len(face_files)} face cards ...\n")
for i, fname in enumerate(face_files, 1):
    input_path = os.path.join(INPUT_DIR, fname)
    output_path = os.path.join(OUTPUT_DIR, fname)
    print(f"  [{i:2d}/{len(face_files)}] {fname}")
    process_card(input_path, output_path, bg_images)
print(f"\n[OK] Done!")
