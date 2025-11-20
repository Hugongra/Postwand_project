import os
import sys

# Add project root to path (parent of backend directory)
# File is at: postwand/backend/services/brand_extraction/info_extraction.py
# We need to add: postwand/ to the path
current_file = os.path.abspath(__file__)
brand_extraction_dir = os.path.dirname(current_file)  # brand_extraction
services_dir = os.path.dirname(brand_extraction_dir)  # services
backend_dir = os.path.dirname(services_dir)  # backend
project_root = os.path.dirname(backend_dir)  # postwand
sys.path.insert(0, project_root)

# Load environment variables FIRST before any imports that need them
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))  # Load from backend/.env

import threading   # <-- REQUIRED for non-blocking Playwright shutdown



# Import backend modules after path is set and env is loaded
from backend.services.brand_extraction.utils import fetch_page
from backend.models.chat.controller import ChatController
from playwright.sync_api import sync_playwright
class LLMBrandAnalyzer:

    def __init__(self, api_key=None):
        self.chat = ChatController.chat_base("openai")


    def clean_font_stack(self, font_stack: str):
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
    
        # Default to sans-serif, then look for actual generic family in the stack
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
    def extract_fonts_with_playwright(self, url):
        unique_main_fonts = {}
        playwright = None
        browser = None

        try:
            playwright = sync_playwright().start()
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()

            # DO NOT USE networkidle
            page.goto(url, wait_until="networkidle")

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

            for stack in font_families:
                main_font, font_type = self.clean_font_stack(stack)
                if main_font not in unique_main_fonts:
                    unique_main_fonts[main_font] = font_type

            return [f"{font}, {ftype}" for font, ftype in unique_main_fonts.items()]

        except Exception as e:
            print(f"Font extraction failed: {e}")
            return []

        finally:
            # Kill Playwright ASAP without blocking Flask
            def cleanup():
                try:
                    if browser:
                        for ctx in browser.contexts:
                            try: ctx.close()
                            except: pass
                        try: browser.close()
                        except: pass
                except: pass

                try:
                    if playwright:
                        playwright.stop()
                except: pass

            threading.Thread(target=cleanup).start()


    def extract_content(self, soup, url):
        metadata = {
            "title": soup.title.string.strip() if soup.title else "",
            "meta_description": "",
            "h1": [],
            "h2": [],
            "h3": [],
            "paragraphs": [],
            "hero_text": [],
            "fonts": []
        }

        # Meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            metadata["meta_description"] = meta_desc["content"].strip()

        # Headings
        for tag in ["h1", "h2", "h3"]:
            for heading in soup.find_all(tag):
                text = heading.get_text(strip=True)
                if text:
                    metadata[tag].append(text)

        # Paragraphs
        for p in soup.find_all("p")[:10]:
            text = p.get_text(strip=True)
            if len(text) > 20:
                metadata["paragraphs"].append(text)

        # Hero sections
        hero_sections = soup.select(".hero, header, .header, .banner, .intro, .tagline, .slogan")
        for section in hero_sections:
            text = section.get_text(strip=True)
            if text:
                metadata["hero_text"].append(text)

        
        # Extract fonts (error handling is inside the method)
        metadata["fonts"] = self.extract_fonts_with_playwright(url)
        
        return metadata

    # ---------------------------------------------------------
    #  PREP + LLM
    # ---------------------------------------------------------

    def prepare_content_for_analysis(self, metadata):
        lines = [
            f"Website Title: {metadata['title']}\n",
            f"Meta Description: {metadata['meta_description']}\n",
            "Main Headings (H1):"
        ]

        for h in metadata["h1"]: lines.append(f"- {h}")
        lines.append("")

        lines.append("Secondary Headings (H2):")
        for h in metadata["h2"][:5]: lines.append(f"- {h}")
        lines.append("")

        lines.append("Tertiary Headings (H3):")
        for h in metadata["h3"][:5]: lines.append(f"- {h}")
        lines.append("")

        lines.append("Hero/Header Text:")
        for text in metadata["hero_text"][:5]: lines.append(f"- {text}")
        lines.append("")

        lines.append("Beginning Paragraphs:")
        for p in metadata["paragraphs"][:5]: lines.append(f"{p}\n")

        return "\n".join(lines)

    def get_default_brand_info(self):
        """Return default brand info structure when analysis fails"""
        return {
            "company_details": {
                "company_description": "",
                "headers_taglines": {
                    "main_heading": "",
                    "taglines": []
                },
                "industry_type": {
                    "category": "",
                    "subcategory": ""
                },
                "fonts": []
            },
            "audience": {
                "professions": [],
                "age_range": "",
                "gender": "all"
            },
            "tone": {
                "tone_emotion": [],
                "brand_character": [],
                "language_style": []
            },
            "product_features": {
                "main_products_services": [],
                "key_features": [],
                "unique_selling_points": [],
                "benefits": [],
                "pricing_model": ""
            }
        }

    def analyze_with_llm(self, content):
        system = (
            "You are an expert brand analyst. Analyze website content and return a JSON object with this structure:\n"
            "{\n"
            "  \"company_details\": {\n"
            "    \"company_description\": \"3-4 sentences describing what the company does, their mission, values, and brand identity\",\n"
            "    \"headers_taglines\": {\n"
            "      \"main_heading\": \"Main heading from the website\",\n"
            "      \"taglines\": [\"5 relevant taglines from the site\"]\n"
            "    },\n"
            "    \"industry_type\": {\n"
            "      \"category\": \"Choose one: SaaS, E-commerce, Agencies, Personal Brands, Local/SMBs\",\n"
            "      \"subcategory\": \"Specific industry like beauty, fashion, food, tech, health, finance, education, etc.\"\n"
            "    }\n"
            "  },\n"
            "  \"audience\": {\n"
            "    \"professions\": [\"Target professions like marketers, content creators, business owners, etc.\"],\n"
            "    \"age_range\": \"Age range like 25-45\",\n"
            "    \"gender\": \"Gender targeting: all, primarily female, primarily male\"\n"
            "  },\n"
            "  \"tone\": {\n"
            "    \"tone_emotion\": [\"3-5 keywords describing tone and emotion like Encouraging, Empowering, Optimistic\"],\n"
            "    \"brand_character\": [\"2-4 keywords describing brand character like Innovative, Supportive, Empowering\"],\n"
            "    \"language_style\": [\"3-5 keywords describing language style like Direct, Conversational, Informal\"]\n"
            "  },\n"
            "  \"product_features\": {\n"
            "    \"main_products_services\": [\"5-10 main products or services offered\"],\n"
            "    \"key_features\": [\"5-10 key features of the product/service\"],\n"
            "    \"unique_selling_points\": [\"5-10 unique selling points\"],\n"
            "    \"benefits\": [\"5-10 benefits to the customer\"],\n"
            "    \"pricing_model\": \"Choose one: subscription, freemium, usage-based, advertising, one-time, custom\"\n"
            "  }\n"
            "}\n"
            "You must respond with valid JSON only."
        )
        user_msg = f"Analyze this website content:\n\n{content}"

        try:
            response = self.chat.send(
                system_prompt=system,
                user_message=user_msg,
                response_format={"type": "json_object"},
                max_tokens=4000,
                model="gpt-4o-mini"
            )
            
            # Handle the response content
            content = response.get("content")
            
            if not content:
                print("LLM returned empty response, using defaults")
                return self.get_default_brand_info()
            return content
                
        except Exception as e:
            print(f"LLM analysis failed: {e}, using defaults")
            return self.get_default_brand_info()

    def execute(self, url):
        try:
            soup, _ = fetch_page(url)
            if not soup:
                print("Failed to fetch website, using default brand info")
                return self.get_default_brand_info()

            content = self.extract_content(soup, url)
            formatted = self.prepare_content_for_analysis(content)
            analysis = self.analyze_with_llm(formatted)

            # Add fonts to the company_details section
            if "company_details" not in analysis:
                analysis["company_details"] = {}
            analysis["company_details"]["fonts"] = content.get("fonts", [])
            
            return analysis
        except Exception as e:
            print(f"Brand info extraction failed: {e}, using defaults")
            return self.get_default_brand_info()

def main():
    url = "https://www.morkes.store"
    analysis = LLMBrandAnalyzer().execute(url)
    print(analysis)

if __name__ == "__main__":
    main()
