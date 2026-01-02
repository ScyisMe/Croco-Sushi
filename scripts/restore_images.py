import os
import shutil

# Root directory where the misplaced webp files are currently located
ROOT_DIR = r"c:\Users\User\Desktop\Croco Sushi"

# Map of filename (without extension) -> correct relative path inside frontend/public (including filename.webp)
FILE_MAPPING = {
    "vegetarian": r"frontend\public\images\vegetarian.webp",
    "story-vegan": r"frontend\public\images\story-vegan.webp",
    "story-spicy": r"frontend\public\images\story-spicy.webp",
    "story-promo": r"frontend\public\images\story-promo.webp",
    "story-new": r"frontend\public\images\story-new.webp",
    "story-hit": r"frontend\public\images\story-hit.webp",
    "sale-tag": r"frontend\public\images\sale-tag.webp",
    "promo-calendar": r"frontend\public\images\promo-calendar.webp",
    "set-phila": r"frontend\public\images\products\set-phila.webp",
    "logo": r"frontend\public\images\logo.webp", 
    "hero-poster": r"frontend\public\images\hero-poster.webp",
    
    # Filters
    "filter-vegan": r"frontend\public\images\filters\filter-vegan.webp",
    "filter-spicy": r"frontend\public\images\filters\filter-spicy.webp",
    "filter-shrimp": r"frontend\public\images\filters\filter-shrimp.webp",
    "filter-salmon": r"frontend\public\images\filters\filter-salmon.webp",
    "filter-popular": r"frontend\public\images\filters\filter-popular.webp",
    "filter-no-cheese": r"frontend\public\images\filters\filter-no-cheese.webp",
    "filter-new": r"frontend\public\images\filters\filter-new.webp",
    "filter-eel": r"frontend\public\images\filters\filter-eel.webp",
    
    "croco-stepper": r"frontend\public\images\croco-stepper.webp",
    
    # Categories
    "sushi": r"frontend\public\images\categories\sushi.webp",
    "signature": r"frontend\public\images\categories\signature.webp",
    "sets": r"frontend\public\images\categories\sets.webp",
    "sauces": r"frontend\public\images\categories\sauces.webp",
    "rolls": r"frontend\public\images\categories\rolls.webp",
    "promo": r"frontend\public\images\categories\promo.webp",
    "drinks": r"frontend\public\images\categories\drinks.webp",
    "classic": r"frontend\public\images\categories\classic.webp",
    
    # Banners
    "tomyam-banner": r"frontend\public\banners\tomyam-banner.webp",
    
    # Badges
    "vegan_custom": r"frontend\public\badges\vegan_custom.webp",
    "vegan": r"frontend\public\badges\vegan.webp",
    "top": r"frontend\public\badges\top.webp",
    "spicy_custom": r"frontend\public\badges\spicy_custom.webp",
    "spicy": r"frontend\public\badges\spicy.webp",
    "new": r"frontend\public\badges\new.webp",
    "hit": r"frontend\public\badges\hit.webp",
}

def restore_images():
    count = 0
    for filename_no_ext, relative_dest in FILE_MAPPING.items():
        source = os.path.join(ROOT_DIR, filename_no_ext + ".webp")
        dest = os.path.join(ROOT_DIR, relative_dest)
        
        if os.path.exists(source):
            try:
                # Ensure dest dir exists
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                
                # Move
                shutil.move(source, dest)
                print(f"Moved {filename_no_ext}.webp -> {relative_dest}")
                count += 1
            except Exception as e:
                print(f"Failed to move {source}: {e}")
        else:
            print(f"Source not found: {source}")

    print(f"Restoration complete. Moved {count} files.")

if __name__ == "__main__":
    restore_images()
