import re

file_path = "c:\\Users\\User\\Desktop\\Croco Sushi\\frontend\\lib\\types\\index.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern to find Product interface and inject fields if not present
if "is_spicy" not in content:
    # Look for the end of Product interface
    # Assuming it ends with '}' and has 'is_popular' or 'position' inside.
    # We'll just look for 'is_popular?: boolean;' and append after it.
    
    pattern = r"(is_popular\?: boolean;)"
    replacement = r"\1\n  is_spicy?: boolean;\n  is_vegan?: boolean;\n  is_vegetarian?: boolean;"
    
    new_content = re.sub(pattern, replacement, content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Updated Product interface.")
else:
    print("Fields already present.")
