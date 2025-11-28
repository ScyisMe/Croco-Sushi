import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from PIL import Image
from io import BytesIO
import time

# Configuration
BASE_URL = "https://king-roll.com.ua/"
OUTPUT_DIR = "../frontend/public/images/products"
TARGET_SIZE = (800, 800)
QUALITY = 85

def setup_directories():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")

def get_soup(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def download_and_optimize_image(img_url, filename):
    try:
        response = requests.get(img_url, timeout=10)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content))
        
        # Convert to RGB if necessary (e.g. for PNGs with transparency)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        # Resize/Crop to square if needed (simple resize for now)
        # img.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
        
        # Save as WebP
        output_path = os.path.join(OUTPUT_DIR, filename)
        img.save(output_path, 'WEBP', quality=QUALITY)
        print(f"Saved: {filename}")
        return True
    except Exception as e:
        print(f"Error processing image {img_url}: {e}")
        return False

def scrape_products():
    soup = get_soup(BASE_URL)
    if not soup:
        return

    # This selector needs to be adjusted based on the actual site structure of king-roll.com.ua
    # Assuming standard e-commerce structure, looking for product images
    # Note: This is a generic scraper, might need adjustment after inspecting the actual site
    
    # Try to find product items. This is hypothetical based on common structures.
    # We might need to inspect the site source to get exact selectors.
    # For now, let's look for common image classes or containers.
    
    products_found = 0
    
    # Example: Look for images inside product cards
    # Adjust these selectors based on actual site inspection if possible
    images = soup.find_all('img')
    
    for img in images:
        src = img.get('src') or img.get('data-src')
        if not src:
            continue
            
        full_url = urljoin(BASE_URL, src)
        
        # Filter for likely product images (often contain 'product', 'upload', etc. or are large enough)
        # This is a heuristic.
        if 'logo' in src.lower() or 'icon' in src.lower():
            continue
            
        # Generate a filename
        parsed_url = urlparse(full_url)
        filename = os.path.basename(parsed_url.path)
        name, ext = os.path.splitext(filename)
        
        if not name or len(name) < 3:
            continue
            
        new_filename = f"{name}.webp"
        
        if os.path.exists(os.path.join(OUTPUT_DIR, new_filename)):
            print(f"Skipping existing: {new_filename}")
            continue
            
        if download_and_optimize_image(full_url, new_filename):
            products_found += 1
            time.sleep(0.5) # Be nice to the server

    print(f"Total images processed: {products_found}")

if __name__ == "__main__":
    setup_directories()
    print("Starting scraper...")
    scrape_products()
    print("Done.")
