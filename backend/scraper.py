import re
import requests
import urllib.parse
from playwright.sync_api import sync_playwright

def extract_nonempty(pattern, text):
    """Like re.search(...).group(1).strip(), but only returns a value if that
    capture actually has non-whitespace content. Needed because some LinkedIn
    markup has the real text inside a nested tag, leaving the outer tag's
    capture group matching whitespace only - a "successful" match with no
    usable text."""
    match = re.search(pattern, text)
    if match:
        value = match.group(1).strip()
        if value:
            return value
    return None

def scrape_linkedin_jobs(query, location):
    jobs = []
    try:
        enc_query = urllib.parse.quote(query)
        enc_location = urllib.parse.quote(location)
        url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={enc_query}&location={enc_location}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        }
        
        res = requests.get(url, headers=headers, timeout=10)
        if not res.ok:
            print(f"[LinkedIn Scraper] HTTP error {res.status_code}")
            return jobs
            
        html = res.text
        lis = html.split('<li>')
        for li in lis[1:]:
            # Parse link
            link_match = re.search(r'href="([^"]+)"', li)
            url_str = link_match.group(1) if link_match else ""
            if "?" in url_str:
                url_str = url_str.split("?")[0]
                
            # Parse Title
            title = (
                extract_nonempty(r'class="base-search-card__title"[^>]*>\s*([^<]+)', li)
                or extract_nonempty(r'class="base-card__title"[^>]*>\s*([^<]+)', li)
                or "Job Position"
            )

            # Parse Company
            # Note: the subtitle's text is usually inside a nested <a class="hidden-nested-link">
            # rather than being direct text, so the subtitle regex often only captures
            # leading whitespace. Both patterns must be checked for non-empty content,
            # not just a regex match, or the (blank) subtitle match wins and the real
            # company name in the nested link is never used.
            company = (
                extract_nonempty(r'class="base-search-card__subtitle"[^>]*>\s*([^<]+)', li)
                or extract_nonempty(r'class="hidden-nested-link"[^>]*>\s*([^<]+)', li)
                or "Company"
            )
            
            # Parse Location
            loc_match = re.search(r'class="job-search-card__location"[^>]*>\s*([^<]+)', li)
            location_str = loc_match.group(1).strip() if loc_match else "Remote"
            
            # Parse Logo
            logo_match = re.search(r'data-delayed-url="([^"]+)"', li)
            if not logo_match:
                logo_match = re.search(r'src="([^"]+)"', li)
            logo = logo_match.group(1) if logo_match else ""
            
            if url_str and title:
                jobs.append({
                    "id": "linkedin_" + str(len(jobs) + 1) + "_" + str(hash(url_str))[-5:],
                    "title": title,
                    "company": company,
                    "location": location_str,
                    "url": url_str,
                    "logo": logo,
                    "source": "LinkedIn",
                    "salary": "N/A",
                    "tags": ["linkedin", "apply"]
                })
    except Exception as e:
        print(f"[LinkedIn Scraper] Failed: {e}")
        
    return jobs

def scrape_indeed_jobs(query, location):
    jobs = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            })
            
            enc_query = urllib.parse.quote(query)
            enc_location = urllib.parse.quote(location)
            url = f"https://www.indeed.com/jobs?q={enc_query}&l={enc_location}"
            
            page.goto(url, timeout=30000)
            
            try:
                page.wait_for_selector('div.job_seen_beacon', timeout=8000)
            except Exception:
                # Fallback to general cards if page structure varies
                pass
                
            cards = page.query_selector_all('div.job_seen_beacon')
            if not cards:
                cards = page.query_selector_all('.job_seen_beacon')
                
            for card in cards:
                title_el = card.query_selector('h2.jobTitle a')
                title = title_el.inner_text().strip() if title_el else "Job Position"
                
                url_path = title_el.get_attribute('href') if title_el else ""
                url_str = f"https://www.indeed.com{url_path}" if url_path else ""
                if "?" in url_str:
                    url_str = url_str.split("?")[0]
                
                company_el = card.query_selector('span[data-testid="company-name"]')
                if not company_el:
                    company_el = card.query_selector('.companyName')
                company = company_el.inner_text().strip() if company_el else "Company"
                
                loc_el = card.query_selector('div[data-testid="text-location"]')
                if not loc_el:
                    loc_el = card.query_selector('.companyLocation')
                loc = loc_el.inner_text().strip() if loc_el else "Remote"
                
                if url_str and title:
                    jobs.append({
                        "id": "indeed_" + str(len(jobs) + 1) + "_" + str(hash(url_str))[-5:],
                        "title": title,
                        "company": company,
                        "location": loc,
                        "url": url_str,
                        "logo": "",
                        "source": "Indeed",
                        "salary": "N/A",
                        "tags": ["indeed", "apply"]
                    })
            browser.close()
    except Exception as e:
        print(f"[Indeed Scraper] Failed: {e}")
        
    return jobs
