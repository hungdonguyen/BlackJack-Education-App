import cv2
import numpy as np

def apply_cosmic_effect(img_path, out_path):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Could not read image:", img_path)
        return

    # Convert to HSV to shift colors
    hsv = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)

    # Note: OpenCV Hue is 0-179
    # Identify red, yellow, blue
    
    # Red: Hue 0-10 or 160-180, high saturation, high value
    mask_red = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([15, 255, 255])) | \
               cv2.inRange(hsv, np.array([160, 50, 50]), np.array([179, 255, 255]))
    
    # Yellow: Hue 15-45
    mask_yellow = cv2.inRange(hsv, np.array([15, 50, 50]), np.array([45, 255, 255]))

    # Blue: Hue 90-130
    mask_blue = cv2.inRange(hsv, np.array([90, 50, 50]), np.array([130, 255, 255]))

    # Shift Red to Magenta/Pink (Hue ~ 150)
    h_new = h.copy()
    h_new[mask_red > 0] = 150
    # Boost saturation for red
    s_new = s.copy()
    s_new[mask_red > 0] = np.clip(s[mask_red > 0] * 1.5, 0, 255).astype(np.uint8)

    # Shift Yellow to Cyan (Hue ~ 90)
    h_new[mask_yellow > 0] = 90
    s_new[mask_yellow > 0] = np.clip(s[mask_yellow > 0] * 1.5, 0, 255).astype(np.uint8)

    # Shift Blue to Deep Purple (Hue ~ 135)
    h_new[mask_blue > 0] = 135

    # Merge back
    hsv_new = cv2.merge([h_new, s_new, v])
    bgr_new = cv2.cvtColor(hsv_new, cv2.COLOR_HSV2BGR)

    # But we only want to apply this to the "inner" part to avoid risking the cosmic background.
    # The inner part is likely a large rectangle in the center.
    # Let's just apply to the whole image since the cosmic background is mostly dark (V is low, S is low or mostly black)
    # Actually wait, the background has starry elements which might have high saturation.
    
    # Let's find the inner white-ish box.
    gray = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    
    # For now, let's just blend using the mask of the colors. 
    # Since red/yellow/blue are mostly on the person, it should naturally only affect the person and the suit icons.
    # Wait, the suit icons are black in C-J.png (Club). For hearts/diamonds they are red. 
    # Shifting red to magenta will affect heart/diamond suit icons too. Is that good? Maybe! Cosmic hearts might look cool as magenta.

    bgr_out = img[:,:,:3].copy()
    
    # Apply changes only where masks are active
    mask_any = mask_red | mask_yellow | mask_blue
    bgr_out[mask_any > 0] = bgr_new[mask_any > 0]

    if len(img.shape) == 3 and img.shape[2] == 4:
        bgra_out = cv2.cvtColor(bgr_out, cv2.COLOR_BGR2BGRA)
        bgra_out[:,:,3] = img[:,:,3]
    else:
        bgra_out = bgr_out

    cv2.imwrite(out_path, bgra_out)
    print("Saved to", out_path)

apply_cosmic_effect(r"c:\Users\Maytinh\Desktop\BlackJack_Web\public\images\cards\cosmic\C-J.png", r"c:\Users\Maytinh\Desktop\BlackJack_Web\public\images\cards\cosmic\test_CJ1.png")
