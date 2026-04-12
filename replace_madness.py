import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    # Replace Madness21Rules with InfinityDoubleDownRules
    new_content = new_content.replace('Madness21', 'InfinityDoubleDown')
    new_content = new_content.replace('madness_21', 'infinity_double_down')
    new_content = new_content.replace('madness', 'infinity_double_down')
    new_content = new_content.replace('Madness', 'InfinityDoubleDown')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            process_file(os.path.join(root, file))
