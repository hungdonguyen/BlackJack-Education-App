import os, sys, numpy as np
from PIL import Image

project_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
os.chdir(project_root)

img = Image.open("public/images/cards/default/H-J.png").convert("RGBA")
arr = np.array(img)
r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
h, w = arr.shape[0], arr.shape[1]

# Let's find the inner blue/black rectangular frame.
# We can look for horizontal and vertical lines of non-white pixels.
non_white = (r < 200) | (g < 200) | (b < 200)

top_edge = -1
bottom_edge = -1
left_edge = -1
right_edge = -1

# Look from top
for y in range(h):
    if np.sum(non_white[y, :]) > w * 0.5:
        top_edge = y
        break

for y in range(h-1, -1, -1):
    if np.sum(non_white[y, :]) > w * 0.5:
        bottom_edge = y
        break

for x in range(w):
    if np.sum(non_white[:, x]) > h * 0.5:
        left_edge = x
        break

for x in range(w-1, -1, -1):
    if np.sum(non_white[:, x]) > h * 0.5:
        right_edge = x
        break

print(f"Top: {top_edge}, Bottom: {bottom_edge}, Left: {left_edge}, Right: {right_edge}")
