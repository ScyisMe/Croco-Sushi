import os

TARGET_DIR = r"c:\Users\User\Desktop\Croco Sushi\frontend\public"
EXTENSIONS = {".png", ".jpg", ".jpeg"}

def cleanup_images():
    deleted_count = 0
    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            base, ext = os.path.splitext(file)
            
            if ext.lower() in EXTENSIONS:
                webp_path = base + ".webp"
                # Check if corresponding webp exists
                if os.path.exists(webp_path):
                    try:
                        os.remove(file_path)
                        print(f"Deleted: {file}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"Failed to delete {file}: {e}")
                else:
                    print(f"Skipping {file} (no webp found)")
    
    print(f"Cleanup complete. Deleted {deleted_count} files.")

if __name__ == "__main__":
    cleanup_images()
