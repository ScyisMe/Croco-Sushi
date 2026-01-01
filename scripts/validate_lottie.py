import json
import os
import argparse
import sys
from typing import List, Dict, Any, Tuple

# Configuration / Defaults
MAX_SIZE_ICON_KB = 30
MAX_SIZE_ILLUSTRATION_KB = 150
MAX_SIZE_HARD_LIMIT_KB = 300
ALLOWED_FPS = [30, 60]

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_error(msg):
    print(f"{Colors.FAIL}[ERROR] {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}[WARN]  {msg}{Colors.ENDC}")

def print_success(msg):
    print(f"{Colors.OKGREEN}[PASS]  {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKBLUE}[INFO]  {msg}{Colors.ENDC}")

def get_file_size_kb(filepath: str) -> float:
    return os.path.getsize(filepath) / 1024

def check_file_size(filepath: str, size_kb: float):
    # Heuristic: We don't know if it's an icon or illustration for sure without naming convention.
    # We will log the size and warn based on thresholds.
    msg = f"Size: {size_kb:.2f} KB"
    
    if size_kb > MAX_SIZE_HARD_LIMIT_KB:
        print_error(f"{msg} (Exceeds absolute max {MAX_SIZE_HARD_LIMIT_KB} KB)")
        return False
    elif size_kb > MAX_SIZE_ILLUSTRATION_KB:
        print_warning(f"{msg} (Exceeds illustration target {MAX_SIZE_ILLUSTRATION_KB} KB)")
        # This is strictly not a failure per user request unless it's way too big, but we warn.
        return True 
    elif size_kb > MAX_SIZE_ICON_KB:
        print_info(f"{msg} (Note: > {MAX_SIZE_ICON_KB} KB - suitable for illustration, check if this is an icon)")
        return True
    else:
        print_success(f"{msg} (Optimal)")
        return True

def check_fps(data: Dict[str, Any]) -> bool:
    fr = data.get('fr')
    if fr is None:
        print_error("Frame rate (fr) missing in JSON")
        return False
    
    if fr not in ALLOWED_FPS:
        print_warning(f"FPS is {fr}. Recommended: 30 or 60")
        return True # Not a hard failure, but warning
    else:
        print_success(f"FPS: {fr}")
        return True

def check_assets_for_raster(data: Dict[str, Any]) -> bool:
    assets = data.get('assets', [])
    has_raster = False
    for asset in assets:
        # Lottie raster images usually have 'p' (path/base64) and 'u' (opt url).
        # Vector layers in assets might just be precomps.
        # If 'p' ends in image extension or if it's base64 data.
        if 'p' in asset:
            p_val = asset['p']
            if p_val.startswith('data:image') or p_val.lower().endswith(('.png', '.jpg', '.jpeg')):
                has_raster = True
                print_error(f"Asset '{asset.get('id')}' contains raster image!")
    
    if not has_raster:
        print_success("No raster assets found")
    return not has_raster

def check_hidden_layers(data: Dict[str, Any]) -> bool:
    # Recursive check for 'hd': true
    found_hidden = []

    def recursive_scan(layers: List[Dict], path: str):
        for layer in layers:
            name = layer.get('nm', 'Unnamed Layer')
            if layer.get('hd', False):
                found_hidden.append(f"{path} -> {name}")
            
            # Check properties for shapes that might be hidden? 
            # Usually 'hd' at layer level is the main one.
            pass

    layers = data.get('layers', [])
    recursive_scan(layers, "Root")
    
    if found_hidden:
        print_warning(f"Found {len(found_hidden)} hidden layers (should be removed):")
        for h in found_hidden[:5]: # Show first 5
            print(f"  - {h}")
        if len(found_hidden) > 5:
            print(f"  ... and {len(found_hidden) - 5} more")
        return False
    else:
        print_success("No hidden layers found")
        return True

def validate_file(filepath: str) -> bool:
    print(f"\n{Colors.BOLD}Validating: {os.path.basename(filepath)}{Colors.ENDC}")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print_error(f"Could not read/parse JSON: {e}")
        return False

    size_kb = get_file_size_kb(filepath)
    
    is_valid = True
    is_valid &= check_file_size(filepath, size_kb)
    is_valid &= check_fps(data)
    is_valid &= check_assets_for_raster(data)
    is_valid &= check_hidden_layers(data)
    
    return is_valid

def main():
    parser = argparse.ArgumentParser(description="Validate Lottie JSON files.")
    parser.add_argument("path", help="Path to directory containing JSON files or a single JSON file")
    args = parser.parse_args()

    target_path = args.path
    if not os.path.exists(target_path):
        print_error(f"Path not found: {target_path}")
        sys.exit(1)

    files_to_check = []
    if os.path.isdir(target_path):
        for root, dirs, files in os.walk(target_path):
            for file in files:
                if file.endswith(".json"):
                    files_to_check.append(os.path.join(root, file))
    else:
        if target_path.endswith(".json"):
            files_to_check.append(target_path)

    if not files_to_check:
        print_warning("No JSON files found to validate.")
        sys.exit(0)

    print_info(f"Found {len(files_to_check)} files to validate...")
    
    failed_count = 0
    for f in files_to_check:
        if not validate_file(f):
            failed_count += 1
    
    print("\n" + "="*30)
    if failed_count == 0:
        print(f"{Colors.OKGREEN}All files passed validation!{Colors.ENDC}")
        sys.exit(0)
    else:
        print(f"{Colors.FAIL}{failed_count} files had warnings or errors.{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()
