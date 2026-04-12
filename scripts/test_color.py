import os
import numpy as np
from PIL import Image

input_path = "public/images/cards/default/S-J.png" # Spades J (Black suit)
output_path = "public/images/cards/cosmic/S-J-test.png"

img = Image.open(input_path).convert("RGBA")
arr = np.array(img).astype(float)
r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]

is_dark = (r < 60) & (g < 60) & (b < 60) & (a > 50)
is_red = (r > 150) & (g < 100) & (b < 100) & (a > 50)
is_white = (r > 200) & (g > 200) & (b > 200) & (a > 50)

# Apply transparent to the existing white parts so the new white lines don't blend!
arr[is_white, 3] = 0  # transparency!
# Wait, let's keep some faint alpha instead of total transparent so they are ghost-like?
# No, let's try 0 alpha first, or maybe a dark blue. Let's make it alpha=0.

arr[is_dark, 0] = 255
arr[is_dark, 1] = 255
arr[is_dark, 2] = 255
arr[is_dark, 3] = 255

arr[is_red, 0] = 255
arr[is_red, 1] = 30
arr[is_red, 2] = 100
arr[is_red, 3] = 255

res = Image.fromarray(arr.astype(np.uint8), "RGBA")
res.save(output_path)
print("Saved S-J-test.png")
