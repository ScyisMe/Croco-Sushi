import os
import json
from PIL import Image

TARGET_DIR = r"c:\Users\User\Desktop\Croco Sushi\frontend\public"
EXTENSIONS = {".png", ".jpg", ".jpeg"}

def convert_images():
    converted_files = []
    
    # Walk through the directory
    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            base, ext = os.path.splitext(file)
            
            if ext.lower() in EXTENSIONS:
                try:
                    # Construct new file path
                    new_file_path = base + ".webp"
                    
                    # Open and save as webp
                    with Image.open(file_path) as img:
                        img.save(new_file_path, "WEBP")
                    
                    # Record the change (old filename -> new filename)
                    # We store just filenames to help with searching usage in code
                    converted_files.append({
                        "original_path": file_path,
                        "original_name": file,
                        "new_name": os.path.basename(new_file_path),
                        "new_path": new_file_path
                    })
                    print(f"Converted: {file} -> {os.path.basename(new_file_path)}")
                except Exception as e:
                    print(f"Failed to convert {file}: {e}")

    # Output the list of converted files as JSON for the agent to parse
    print("START_JSON_OUTPUT")
    print(json.dumps(converted_files, indent=2))
    print("END_JSON_OUTPUT")

if __name__ == "__main__":
    convert_images()
