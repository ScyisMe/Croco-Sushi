from PIL import Image
import os

def optimize_hero(path, output_path):
    try:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            return

        img = Image.open(path)
        print(f"Processing {path}: {img.size}")

        # Resize to 1280px width (sufficient for mobile/tablet "Hero" usage given the quality tradeoff)
        # 1920 is often overkill for a background video poster on mobile
        max_width = 1080 
        
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            print(f"  Resized to {img.size}")
        
        # Save with quality=60 (aggressive)
        img.save(output_path, 'WEBP', quality=60, optimize=True)
        print(f"  Saved to {output_path}")

        # Compare sizes
        original_size = os.path.getsize(path)
        new_size = os.path.getsize(output_path)
        print(f"  Size reduction: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({(1 - new_size/original_size)*100:.1f}%)")

    except Exception as e:
        print(f"Error processing {path}: {e}")

# Note: We are re-processing the ORIGINAL if possible, but if only WebP exists, we re-compress it.
# Ideally we should use the source, but if deleted, we re-compress the WebP.
# Let's check if we have a source. If not, re-compress WebP.
source = "public/images/hero-poster.webp"
optimize_hero(source, source)
