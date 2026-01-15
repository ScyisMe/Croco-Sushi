import os
import asyncio
from pathlib import Path
from PIL import Image

# Configuration
UPLOAD_DIR = Path("../uploads")  # Adjust relative path as needed
MAIN_MAX_SIZE = (1000, 1000)
THUMB_MAX_SIZE = (500, 500)
MAIN_QUALITY = 82  # Target ~80-120KB
THUMB_QUALITY = 75 # Target ~15-25KB

async def process_image(file_path: Path):
    try:
        if file_path.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.webp']:
            return

        # Skip already processed thumbnails if they follow a naming convention involving 'thumb_'
        # But we might want to re-process them if they are too big. 
        # For now, let's focus on main images and let the script generate thumbnails for them.
        if file_path.name.startswith("thumb_"):
            return

        print(f"Processing: {file_path}")
        
        with Image.open(file_path) as img:
            # Convert to RGB if needed
            if img.mode in ("RGBA", "P"):
                 if img.mode == "RGBA":
                     pass # WebP supports Alpha
                 else:
                     img.convert("RGB")
            
            # 1. Process Main Image
            main_img = img.copy()
            main_img.thumbnail(MAIN_MAX_SIZE, Image.Resampling.LANCZOS)
            
            # Save as WebP
            webp_path = file_path.with_suffix('.webp')
            main_img.save(webp_path, "WEBP", quality=MAIN_QUALITY, optimize=True)
            print(f"  Saved Main: {webp_path.name}")
            
            # 2. Process Thumbnail
            thumb_img = img.copy()
            thumb_img.thumbnail(THUMB_MAX_SIZE, Image.Resampling.LANCZOS)
            
            # Construct thumbnail path (assuming specific naming convention or finding existing)
            # Strategy: Always create a 'thumb_' version for every image found
            thumb_path = file_path.parent / f"thumb_{file_path.stem}.webp"
            thumb_img.save(thumb_path, "WEBP", quality=THUMB_QUALITY, optimize=True)
            print(f"  Saved Thumb: {thumb_path.name}")
            
            # Optional: Delete original if it wasn't webp? 
            # For safety, let's keep originals for now or maybe just print what we would do.
            # user asked to convert, implying replacement usually, but let's be safe.
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

async def main():
    root_dir = Path(__file__).parent.parent / "uploads"
    if not root_dir.exists():
        print(f"Directory not found: {root_dir}")
        return

    print(f"Scanning {root_dir}...")
    
    # Recursively find all images
    tasks = []
    for file_path in root_dir.rglob("*"):
        if file_path.is_file():
            tasks.append(process_image(file_path))
    
    await asyncio.gather(*tasks)
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
