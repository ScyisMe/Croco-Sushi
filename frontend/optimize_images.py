
import os
from PIL import Image

def optimize_image(path, max_width=400, colors=64):
    try:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            return

        original_size = os.path.getsize(path)
        img = Image.open(path)
        print(f"Optimizing {path}: {img.size} ({original_size/1024:.2f} KB)")

        # Resize
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            print(f"  Resized to {img.size}")

        if path.endswith('.png'):
            # Aggressive quantization for icon-like graphics
            img = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=colors)
            img.save(path, 'PNG', optimize=True)
        
        elif path.endswith('.jpg') or path.endswith('.jpeg'):
            img.save(path, 'JPEG', quality=70, optimize=True)

        new_size = os.path.getsize(path)
        print(f"  Done: {new_size/1024:.2f} KB (Saved {(original_size-new_size)/1024:.2f} KB)")

    except Exception as e:
        print(f"Error optimizing {path}: {e}")

files = [
    "public/logo.png",
    "public/images/story-hit.png",
    "public/images/story-new.png",
    "public/images/story-spicy.png",
    "public/images/story-promo.png",
    "public/images/story-vegan.png",
]

for f in files:
    optimize_image(f)
