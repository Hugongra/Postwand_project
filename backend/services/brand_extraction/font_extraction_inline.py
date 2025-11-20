import os
import sys
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

# Add project root to path
current_file = os.path.abspath(__file__)
brand_extraction_dir = os.path.dirname(current_file)
services_dir = os.path.dirname(brand_extraction_dir)
backend_dir = os.path.dirname(services_dir)
project_root = os.path.dirname(backend_dir)
sys.path.insert(0, project_root)

# Load environment variables
load_dotenv(os.path.join(backend_dir, '.env'))


# -------------------------------------
# CLEANING + FONT TYPE DETECTION
# -------------------------------------
def clean_font_stack(font_stack: str):
    """
    Input:  'diatype, "diatype Fallback", Arial, sans-serif'
    Output: ('diatype', 'sans-serif')
    """

    # Split by commas, strip quotes & spaces
    parts = [p.strip().strip('"').strip("'") for p in font_stack.split(",")]

    # 1) MAIN FONT
    main_font = parts[0]

    # 2) EXTENDED GENERIC FONT FAMILY DETECTION
    generic_families = [
        "serif",
        "sans-serif",
        "monospace",
        "cursive",
        "fantasy",
        "system-ui",
        "ui-serif",
        "ui-sans-serif",
        "ui-monospace",
        "emoji",
        "math",
        "fangsong",
        "inherit",
        "default",
    ]

    font_type = "sans-serif"
    for p in parts:
        low = p.lower()
        if low in generic_families:
            font_type = low
            break

    # If the main font is empty quotes → fallback to next font
    if main_font == "":
        # Find first non-empty font
        for p in parts:
            if p not in ["", " ", "\"\"", "''"]:
                main_font = p
                break

    return main_font, font_type


# -------------------------------------
# PLAYWRIGHT FONT EXTRACTOR
# -------------------------------------
def extract_fonts_with_playwright(url):
    unique_main_fonts = {}  # { main_font: font_type }

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)

        # JS: Get all computed font stacks
        font_families = page.evaluate("""() => {
            const all = document.querySelectorAll('*');
            const fonts = new Set();
            all.forEach(el => {
                const style = window.getComputedStyle(el);
                const ff = style.getPropertyValue('font-family');
                if (ff) fonts.add(ff);
            });
            return Array.from(fonts);
        }""")

        browser.close()

    # Clean and deduplicate based on main font
    for stack in font_families:
        main_font, font_type = clean_font_stack(stack)

        # Save only first occurrence of each unique main font
        if main_font not in unique_main_fonts:
            unique_main_fonts[main_font] = font_type

    # Format as requested: ["Arial, sans-serif", "Times, serif", ...]
    result = [f"{font}, {ftype}" for font, ftype in unique_main_fonts.items()]

    return result


# -------------------------------------
# MAIN
# -------------------------------------
def main():
    url = "https://drinkag1.com/"
    fonts = extract_fonts_with_playwright(url)
    print(fonts)


if __name__ == "__main__":
    main()
