from PIL import Image
import os

try:
    if os.path.exists("public/logo.png"):
        img = Image.open("public/logo.png")
        img.save("public/favicon.ico", format='ICO', sizes=[(32, 32)])
        print("Created favicon.ico")
    elif os.path.exists("public/logo.webp"):
        img = Image.open("public/logo.webp")
        img.save("public/favicon.ico", format='ICO', sizes=[(32, 32)])
        print("Created favicon.ico from webp")
    else:
        print("No source logo found")
except Exception as e:
    print(f"Error: {e}")
