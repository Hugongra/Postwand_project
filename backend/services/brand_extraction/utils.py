import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import random
import time
from playwright.sync_api import sync_playwright

DEFAULT_TIMEOUT = 10

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.118 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.97 Safari/537.36",
    # add more if needed
]

def normalize_url(url):
    if not url.startswith(('http://', 'https://')):
        return 'https://' + url.lstrip('/')
    return url

def fetch_page(url):
    url = normalize_url(url)
    headers = {"User-Agent": random.choice(USER_AGENTS)}  # random UA
    try:
        response = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        return soup, response.url
    except requests.RequestException as e:
        print(f"Error fetching page from {url}: {e}")
        return None, None


def fetch_json(url):
    url = normalize_url(url)
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    try:
        response = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching JSON from {url}: {e}")
        return None

def get_domain_and_name(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.replace('www.', '')
    name = domain.split('.')[0].capitalize()
    return domain, name


def fetch_page_playwright(url, wait=2):
    """
    Fetch a page using Playwright, render JS, and return BeautifulSoup object.
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                # Random User-Agent
                ua_list = [
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.118 Safari/537.36",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0",
                ]
                user_agent = random.choice(ua_list)
                
                # Create context with user-agent
                context = browser.new_context(user_agent=user_agent)
                page = context.new_page()

                page.goto(url, timeout=60000)

                # Optional: scroll to bottom to trigger lazy-load
                for _ in range(3):
                    page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                    time.sleep(wait)

                content = page.content()
                
                soup = BeautifulSoup(content, "html.parser")
                return soup, page
            finally:
                # Always close browser, even if timeout occurs
                browser.close()
    except Exception as e:
        print(f"Playwright fetch failed for {url}: {e}")
        return None, None

