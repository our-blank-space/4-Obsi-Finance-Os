
import re

file_path = '/home/kira/Desktop/desarrolloia/.obsidian/plugins/finance-os-plugin2/src/utils/translations.ts'

with open(file_path, 'r') as f:
    content = f.read()

# simpler regex for Python
en_match = re.search(r"en: \{([\s\S]*?)\n\s*\},", content)
es_match = re.search(r"es: \{([\s\S]*?)\n\s*\},", content) # Adjusted regex for potentially closing braces

def parse_keys(text):
    keys = set()
    for line in text.splitlines():
        match = re.search(r"^\s*'([\w\.]+)'\s*:", line)
        if match:
            keys.add(match.group(1))
    return keys

if en_match and es_match:
    en_keys = parse_keys(en_match.group(1))
    es_keys = parse_keys(es_match.group(1))
    
    missing_in_es = list(en_keys - es_keys)
    missing_in_en = list(es_keys - en_keys)
    
    print("Missing in ES:", missing_in_es)
    print("Missing in EN:", missing_in_en)
else:
    print("Could not find en or es objects")
