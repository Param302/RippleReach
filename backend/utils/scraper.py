import requests
from bs4 import BeautifulSoup

def get_company_description(domain: str) -> str:
    if not is_valid_url(domain):
        domain = f"https://{domain}"
    
    content = []
    visited_urls = set()
    
    def extract_content(url: str) -> None:
        if url in visited_urls:
            return
        visited_urls.add(url)
        
        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            content.append(meta_desc.get('content').strip())
        
        # Find relevant links
        about_links = []
        for link in soup.find_all('a', href=True):
            href = link.get('href')
            text = link.text.lower().strip()
            if any(term in text for term in ['about', 'company', 'who we are']):
                if href.startswith('/'):
                    href = f"{domain.rstrip('/')}{href}"
                elif not href.startswith('http'):
                    continue
                about_links.append(href)
        
        # Extract main content
        main_content = []
        for elem in soup.find_all(['h1', 'h2', 'h3', 'p']):
            if elem.text.strip():
                main_content.append(elem.text.strip())
        
        content.extend(main_content[:15])  # Limit main content
        
        # Visit about pages
        for link in about_links[:2]:  # Limit to first 2 about links
            if len(' '.join(content).split()) < 200:  # Check word count
                extract_content(link)
    
    extract_content(domain)
    
    # Combine and trim to 200 words
    final_text = ' '.join(content)
    words = final_text.split()
    if len(words) > 1000:
        final_text = ' '.join(words[:1000]) + '...'
    
    print(visited_urls)
    return final_text


def is_valid_url(url: str) -> bool:
    # Validates URL
    if not url:
        return False
        
    try:
        from urllib.parse import urlparse
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False