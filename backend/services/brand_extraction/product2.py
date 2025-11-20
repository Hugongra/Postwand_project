import json
import sys
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import re

from .utils import fetch_json
from utils.image_utils import save_image_supabase

class SimpleJSONProductExtractor:
    def __init__(self):
        self.products = {}  # prevent duplicates

    # ------------------------------------------
    # Shopify JSON → Unified Format
    # ------------------------------------------


    def format_product(self, base, p):
        # Name
        name = p.get("title") or ""
    
        # Description (cleaned)
        raw_desc = p.get("body_html") or ""
        soup = BeautifulSoup(raw_desc, "html.parser")
    
        # Remove all <img> tags (like emoji images)
        for img in soup.find_all("img"):
            img.decompose()
    
      # Get text and normalize whitespace
        description = soup.get_text(separator="\n")
        description = re.sub(r'\n+', '\n', description)  # replace multiple newlines with one
        description = description.strip()
        # Remove emojis and other non-standard symbols
        description = re.sub(r'[^\w\s.,;:!?()\-\n]', '', description)
    
        # Price (lowest variant price)
        price = None
        if "variants" in p and len(p["variants"]) > 0:
            prices = [float(v["price"]) for v in p["variants"] if "price" in v]
            if prices:
                price = min(prices)
    
        # Images: get all images
        images = []
        if "images" in p and len(p["images"]) > 0:
            for img in p["images"]:
                if "src" in img:
                    images.append(img["src"])
        elif "image" in p and p["image"] and "src" in p["image"]:
            images.append(p["image"]["src"])
    
        # Product link
        product_link = urljoin(base, f"/products/{p.get('handle','')}")

        return {
            "name": name,
            "price": price,
            "description": description,
            "images": images,
            "product_link": product_link
        }


    # ------------------------------------------
    # Extract from domain.com/products.json
    # ------------------------------------------
    def extract_from_products_json(self, base):
        url = urljoin(base, "/products.json?limit=250")
        data = fetch_json(url)
        if not data or "products" not in data:
            return False
        for p in data["products"]:
            self.products[p["id"]] = p
        return True

    # ------------------------------------------
    # Extract from /collections.json
    # ------------------------------------------
    def extract_from_collections(self, base):
        url = urljoin(base, "/collections.json?limit=250")
        data = fetch_json(url)
        if not data or "collections" not in data:
            return False
        for col in data["collections"]:
            handle = col.get("handle")
            if not handle:
                continue
            self.extract_products_from_collection(base, handle)
        return True

    # ------------------------------------------
    # Extract from /collections/<handle>/products.json
    # ------------------------------------------
    def extract_products_from_collection(self, base, handle):
        page = 1
        while True:
            url = urljoin(base, f"/collections/{handle}/products.json?limit=250&page={page}")
            data = fetch_json(url)
            if not data or "products" not in data or len(data["products"]) == 0:
                break
            for p in data["products"]:
                self.products[p["id"]] = p
            page += 1

    # ------------------------------------------
    # MAIN
    # ------------------------------------------
    def extract(self, url):
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"

        # 1) Try /products.json
        if self.extract_from_products_json(base):
            pass
        # 2) Otherwise try collections.json
        elif self.extract_from_collections(base):
            pass
        else:
            return []

        formatted = [self.format_product(base, p) for p in self.products.values()]
        return formatted

    def execute(self, url, user_id, storage_bucket='brand-images'):
        """Extract products and keep original CDN URLs"""
        products = self.extract(url)
        
        if not products:
            return []
        
        # Keep original CDN URLs from the website instead of uploading to Supabase
        # parsed = urlparse(url)
        # domain = parsed.netloc.replace("www.", "")
        # folder_name = f"{user_id}/{domain}/products"
        
        # # Upload product images to Supabase
        # for product in products:
        #     if product.get('images'):
        #         uploaded_images = []
        #         for img_url in product['images']:
        #             try:
        #                 result = save_image_supabase(storage_bucket, folder_name, img_url)
        #                 if result.get('success'):
        #                     uploaded_images.append(result.get('image_url'))
        #             except Exception as e:
        #                 print(f"Error uploading product image {img_url}: {e}")
        #                 continue
        #         product['images'] = uploaded_images
        
        return products


# ------------------------------------------
# CLI
# ------------------------------------------
def main():
    if len(sys.argv) < 2:
        print("Usage: python extractor.py <url>")
        sys.exit(1)

    url = sys.argv[1]
    extractor = SimpleJSONProductExtractor()
    products = extractor.extract(url)

    print(json.dumps(products, indent=2, ensure_ascii=False))
    print(f"\nTOTAL PRODUCTS: {len(products)}")


if __name__ == "__main__":
    main()
