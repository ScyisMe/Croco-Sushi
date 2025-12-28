from PIL import Image
import os

files = ["public/logo.png", "public/logo.webp", "public/logo.jpg"]

for f in files:
    if os.path.exists(f):
        try:
            img = Image.open(f)
            print(f"{f}: {img.size} ({img.format})")
        except Exception as e:
            print(f"{f}: Error {e}")
    else:
        print(f"{f}: Not found")
