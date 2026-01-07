from PIL import Image
import os

# Define paths
BASE_DIR = r"c:\Users\User\Desktop\Croco Sushi\frontend\public"
LOGO_PATH = os.path.join(BASE_DIR, "logo.webp")
VEGAN_PATH = os.path.join(BASE_DIR, "badges", "vegan_custom.webp")

def resize_image(path, size, name):
    try:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            return

        with Image.open(path) as img:
            print(f"Original size of {name}: {img.size}")
            # Resize using LANCZOS for high quality downsampling
            resized_img = img.resize(size, Image.Resampling.LANCZOS)
            resized_img.save(path, "WEBP", quality=90)
            print(f"Resized {name} to {size}. Saved to {path}")

    except Exception as e:
        print(f"Error resizing {name}: {e}")

if __name__ == "__main__":
    # Resize Logo to 148x128 (approx 2x of 74x64)
    # Note: Maintaining aspect ratio is important.
    # User requested 148x128. Let's check original aspect ratio if possible, 
    # but for now we follow instructions or fit within box.
    # Actually, original is 221x222 (almost square).
    # 74x64 is displayed size? 74/64 = ~1.15. 221/222 = ~1. 
    # The user recommendation 148x128 (1.15 ratio) matches the DISPLAYED ratio.
    # So we force resize to 148x128 as requested.
    resize_image(LOGO_PATH, (148, 128), "logo.webp")

    # Resize Vegan badge to 48x48
    # User suggested 32x32 or 48x48. 48x48 is safer for high DPI.
    resize_image(VEGAN_PATH, (48, 48), "vegan_custom.webp")
