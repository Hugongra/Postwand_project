import requests
from bs4 import BeautifulSoup
import re
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMBrandAnalyzer:
    def __init__(self, api_key=None):
        """Initialize the LLM-based brand analyzer"""
        # Use provided API key or get from environment variable
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass to constructor.")
        
        self.client = OpenAI(api_key=self.api_key)
        
    def fetch_website(self, url):
        """Fetch website content"""
        try:
            # Add http if not present
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            return BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            print(f"Error fetching website: {e}")
            return None

    def extract_content(self, soup):
        """Extract key content for analysis"""
        # Extract basic metadata
        metadata = {
            'title': soup.title.string.strip() if soup.title else '',
            'meta_description': '',
            'h1': [],
            'h2': [],
            'h3': [],
            'paragraphs': []
        }
        
        # Get meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            metadata['meta_description'] = meta_desc['content'].strip()
        
        # Get headings
        for h1 in soup.find_all('h1'):
            text = h1.get_text().strip()
            if text:
                metadata['h1'].append(text)
        
        for h2 in soup.find_all('h2'):
            text = h2.get_text().strip()
            if text:
                metadata['h2'].append(text)
                
        for h3 in soup.find_all('h3'):
            text = h3.get_text().strip()
            if text:
                metadata['h3'].append(text)
        
        # Get first few paragraphs
        for p in soup.find_all('p')[:10]:  # First 10 paragraphs
            text = p.get_text().strip()
            if text and len(text) > 20:  # Skip very short text
                metadata['paragraphs'].append(text)
        
        # Get text from hero/header sections
        hero_sections = soup.select('.hero, header, .header, .banner, .intro, .tagline, .slogan')
        hero_text = []
        for section in hero_sections:
            text = section.get_text().strip()
            if text:
                hero_text.append(text)
        
        metadata['hero_text'] = hero_text
        
        return metadata

    def prepare_content_for_analysis(self, metadata):
        """Prepare content in a format suitable for LLM analysis"""
        # Combine and format the extracted content
        content = f"Website Title: {metadata['title']}\n\n"
        content += f"Meta Description: {metadata['meta_description']}\n\n"
        
        content += "Main Headings (H1):\n"
        for h in metadata['h1']:
            content += f"- {h}\n"
        content += "\n"
        
        content += "Secondary Headings (H2):\n"
        for h in metadata['h2'][:5]:  # Limit to first 5
            content += f"- {h}\n"
        content += "\n"
        
        content += "Tertiary Headings (H3):\n"
        for h in metadata['h3'][:5]:  # Limit to first 5
            content += f"- {h}\n"
        content += "\n"
        
        content += "Hero/Header Text:\n"
        for text in metadata['hero_text'][:5]:  # Limit to first 5
            content += f"- {text}\n"
        content += "\n"
        
        content += "Beginning Paragraphs:\n"
        for p in metadata['paragraphs'][:5]:  # Limit to first 5
            content += f"{p}\n\n"
        
        return content

    def analyze_with_llm(self, content):
        """Use OpenAI API to analyze the brand elements"""
        prompt = f"""
        Please analyze the following website content and provide insights about the brand:

        {content}

        Based on this content, please provide a structured JSON response with the following analysis, following the exact format specified:

        1. headers_taglines: Object with "main_heading" (string) and "taglines" (array of strings)
        2. purpose: String describing the website purpose (e.g., "service-based", "e-commerce", "informational")
        3. audience: Object with these exact keys:
           - "professions": array of strings (e.g., ["marketers", "content creators"])
           - "consumer_business_industry": string (e.g., "business", "consumer", "healthcare")
           - "age_range": string (e.g., "25-45")
           - "gender": string (e.g., "all", "primarily female", "primarily male")
        4. tone_emotion: Array of 3-5 keyword strings (e.g., ["Encouraging", "Empowering", "Optimistic", "Supportive"])
        5. brand_character: Array of 2-4 keyword strings (e.g., ["Innovative", "Supportive", "Empowering"])
        6. language_style: Array of 3-5 keyword strings (e.g., ["Direct", "Conversational", "Informal", "Motivational"])
        7. company_description: String providing a comprehensive paragraph describing what the company does, their mission, values, and overall brand identity (3-4 sentences)

        Example of the exact JSON structure expected:
        {{
          "headers_taglines": {{
            "main_heading": "Make great content as a team of one.",
            "taglines": ["Simplify your workflow", "Create faster with AI"]
          }},
          "purpose": "service-based",
          "audience": {{
            "professions": ["marketers", "content creators", "small business owners"],
            "consumer_business_industry": "business",
            "age_range": "25-45",
            "gender": "all"
          }},
          "tone_emotion": ["Encouraging", "Empowering", "Optimistic", "Supportive"],
          "brand_character": ["Innovative", "Supportive", "Empowering"],
          "language_style": ["Direct", "Conversational", "Informal", "Motivational"],
          "company_description": "This company provides AI-powered content creation tools designed to help marketers and content creators streamline their workflow. They focus on empowering individuals and small teams to produce high-quality content efficiently. Their mission centers around democratizing content creation through innovative technology while maintaining a supportive, user-friendly approach that values creativity and productivity."
        }}

        IMPORTANT: Always return all fields in exactly this format. Each array should contain separate single keywords.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Use appropriate model
                messages=[
                    {"role": "system", "content": "You are an expert brand analyst who extracts and analyzes brand elements from website content. Always return complete, well-structured JSON with all required fields."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2  # Keep it factual
            )
            
            # Parse the JSON response
            analysis = json.loads(response.choices[0].message.content)
            return analysis
        except Exception as e:
            print(f"Error with LLM analysis: {e}")
            return {
                "error": f"Analysis failed: {str(e)}"
            }

    def analyze_brand(self, url):
        """Main method to analyze a brand's website"""
        # Fetch and process website
        soup = self.fetch_website(url)
        if not soup:
            return {"error": "Failed to fetch website"}
        
        # Extract content
        content_data = self.extract_content(soup)
        
        # Prepare for LLM
        formatted_content = self.prepare_content_for_analysis(content_data)
        
        # LLM analysis
        analysis = self.analyze_with_llm(formatted_content)
        
        # Add URL to results
        analysis["url"] = url
        
        return analysis

# Simplified function to initialize the analyzer and get a brand analysis
def info_extraction():
    """Initialize and return a brand analyzer instance"""
    api_key = os.getenv("OPENAI_API_KEY")
    return LLMBrandAnalyzer(api_key)