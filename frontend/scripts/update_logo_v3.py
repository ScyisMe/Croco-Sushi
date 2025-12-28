from PIL import Image
import os

# Path to the uploaded image (source)
uploaded_logo_path = "C:/Users/User/.gemini/antigravity/brain/253f9510-2c55-42fc-9801-1ea7182b1cdb/uploaded_image_1_1766921604294.png"
public_dir = "public"

def update_logo_v3():
    if not os.path.exists(uploaded_logo_path):
        print(f"Error: Uploaded file not found at {uploaded_logo_path}")
        return

    try:
        img = Image.open(uploaded_logo_path)
        print(f"Loaded new logo (Source): {img.size} {img.format}")

        # 1. favicon.ico (32x32)
        ico_path = os.path.join(public_dir, "favicon.ico")
        img.resize((32, 32), Image.Resampling.LANCZOS).save(ico_path, format='ICO')
        print(f"Updated {ico_path}")

        # 2. logo.webp (Optimize for Header - keep slightly higher res but optimize)
        # Limit to 512px for optimal header size/performance
        img_copy = img.copy()
        max_size = 512
        if img_copy.width > max_size or img_copy.height > max_size:
            img_copy.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        webp_path = os.path.join(public_dir, "logo.webp")
        img_copy.save(webp_path, "WEBP", quality=90)
        print(f"Updated {webp_path} (Size: {img_copy.size})")

        # 3. logo.png (Apple Touch Icon / Metadata)
        png_path = os.path.join(public_dir, "logo.png")
        img_copy.save(png_path, "PNG")
        print(f"Updated {png_path}")

    except Exception as e:
        print(f"Error processing logo: {e}")

if __name__ == "__main__":
    update_logo_v3()
