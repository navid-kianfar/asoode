import os
import re
import json

def extract_keys():
    # Regular expression to match i18n keys: $t('KEY') or t('KEY')
    pattern = re.compile(r'\b(?:\$t|t)\s*\(\s*([\'"])(.*?)\1')
    
    frontend_src = 'apps/frontend/src'
    found_keys = set()
    
    # Noise filters (Common patterns that aren't i18n keys)
    ignore_prefixes = (
        '/', '@/', 'mdi-', 'mdi ', 'mdi:', 'http:', 'https:', 'fa-', 
        'on-', 'v-', 'update:', 'open-', 'close-', 'save-', 'delete-', 
        'toggle-', 'switch-', 'remove-', 'add-', 'edit-', 'click-', 'drop-'
    )
    ignore_chars = ('#', '.', ',', ':', '/', '_', '-', ' ', '(', ')')
    ignore_suffixes = ('.vue', '.ts', '.js', '.scss', '.css')
    
    for root, dirs, files in os.walk(frontend_src):
        for file in files:
            if file.endswith(('.vue', '.ts', '.js')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        matches = pattern.findall(content)
                        for _, key in matches:
                            key = key.strip()
                            if not key or len(key) < 2:
                                continue
                            # 1. Skip obvious non-i18n strings
                            if any(key.startswith(p) for p in ignore_prefixes):
                                continue
                            if any(key.endswith(s) for s in ignore_suffixes):
                                continue
                            # 2. Skip dynamic keys (contain ticks or variables)
                            if key.startswith(('`', '$', '{')):
                                continue
                            # 3. Skip if it's just noise chars
                            if all(c in ignore_chars for c in key):
                                continue
                                
                            found_keys.add(key)
                except Exception as e:
                    print(f"Error reading {path}: {e}")
    
    return found_keys

def get_existing_keys():
    en_path = 'apps/frontend/public/i18n/en.json'
    if not os.path.exists(en_path):
        print(f"Error: {en_path} not found")
        return set()
    
    with open(en_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return set(data.keys())

def main():
    print("Extracting keys from frontend source...")
    source_keys = extract_keys()
    print(f"Found {len(source_keys)} unique keys in source code.")
    
    print("Reading existing keys from en.json...")
    existing_keys = get_existing_keys()
    print(f"Found {len(existing_keys)} keys in en.json.")
    
    missing = source_keys - existing_keys
    
    if not missing:
        print("\nSuccess! No missing keys found.")
    else:
        print(f"\nFound {len(missing)} missing keys:")
        # Sort for readability
        for key in sorted(list(missing)):
            print(f"  - {key}")

if __name__ == "__main__":
    main()
