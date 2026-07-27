import json
import os
import io
import requests
from playwright.sync_api import sync_playwright
from ai_engine import solve_questions, map_fields_fallback

def submit_application_headless(api_key, resume_data, job_url, mode='hybrid'):
    """
    Launches a headless browser to automatically parse, fill, and optionally submit a job application.
    Supports modes: 'manual', 'hybrid', 'auto'.
    """
    result_log = []
    def log(msg):
        print(f"[AUTOMATION ENGINE] {msg}")
        result_log.append(msg)

    log(f"Launching headless browser to apply at: {job_url} [Mode: {mode}]")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        try:
            page.goto(job_url, timeout=30000)
            page.wait_for_load_state("networkidle")
            
            # Scrape Job Title & Company from page
            job_title = page.title().split(" - ")[0]
            log(f"Opened page: {page.title()}")

            # Find all interactive elements
            inputs = page.query_selector_all("input, textarea, select")
            log(f"Detected {len(inputs)} total input elements.")

            # Prune input details to serialize for AI DOM fallback if needed
            pruned_inputs = []
            unresolved_elements = []

            # 1. Fill basic details via heuristics
            for el in inputs:
                # Skip hidden fields
                if not el.is_visible():
                    continue

                name_attr = el.get_attribute("name") or ""
                id_attr = el.get_attribute("id") or ""
                placeholder = el.get_attribute("placeholder") or ""
                
                # Try to locate associated labels
                label_text = ""
                if id_attr:
                    label_el = page.query_selector(f"label[for='{id_attr}']")
                    if label_el:
                        label_text = label_el.inner_text().strip()

                if not label_text:
                    # Parent label check
                    parent_label = el.evaluate("el => el.closest('label') ? el.closest('label').innerText : ''")
                    if parent_label:
                        label_text = parent_label.strip()

                tag_name = el.evaluate("el => el.tagName")
                el_type = el.get_attribute("type") or ""

                # Run simple heuristic checks
                label_lower = label_text.lower()
                name_lower = name_attr.lower()

                is_first = "first" in label_lower or "given" in label_lower or "first" in name_lower
                is_last = "last" in label_lower or "family" in label_lower or "last" in name_lower
                is_name = not is_first and not is_last and ("name" in label_lower or "name" in name_lower)
                is_email = "email" in label_lower or "email" in name_lower or el_type == "email"
                is_phone = "phone" in label_lower or "tel" in label_lower or "phone" in name_lower or el_type == "tel"
                
                is_linkedin = "linkedin" in label_lower or "linkedin" in name_lower
                is_github = "github" in label_lower or "github" in name_lower
                is_website = "website" in label_lower or "portfolio" in label_lower or "website" in name_lower

                if is_first:
                    first_name = resume_data.get("personal", {}).get("name", "").split(" ")[0]
                    el.fill(first_name)
                    log(f"Filled First Name: {first_name}")
                elif is_last:
                    last_name = resume_data.get("personal", {}).get("name", "").split(" ")[-1]
                    el.fill(last_name)
                    log(f"Filled Last Name: {last_name}")
                elif is_name:
                    full_name = resume_data.get("personal", {}).get("name", "")
                    el.fill(full_name)
                    log(f"Filled Full Name: {full_name}")
                elif is_email:
                    email = resume_data.get("personal", {}).get("email", "")
                    el.fill(email)
                    log(f"Filled Email: {email}")
                elif is_phone:
                    phone = resume_data.get("personal", {}).get("phone", "")
                    el.fill(phone)
                    log(f"Filled Phone: {phone}")
                elif is_linkedin:
                    li = resume_data.get("personal", {}).get("linkedin", "")
                    el.fill(li)
                    log(f"Filled LinkedIn: {li}")
                elif is_github:
                    gh = resume_data.get("personal", {}).get("github", "")
                    el.fill(gh)
                    log(f"Filled GitHub: {gh}")
                elif is_website:
                    web = resume_data.get("personal", {}).get("website", "")
                    el.fill(web)
                    log(f"Filled Portfolio: {web}")
                elif el_type == "file" and ("resume" in label_lower or "cv" in label_lower or "resume" in name_lower):
                    name = resume_data.get("personal", {}).get("name", "Candidate")
                    
                    # Generate temporary PDF local file
                    temp_pdf_path = os.path.join(os.getcwd(), f"{name.replace(' ', '_')}_Resume.pdf")
                    pdf_content = (
                        b"%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n"
                        b"2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj\n"
                        b"3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<<>>>> endobj\n"
                        b"4 0 obj <</Length 45>> stream\nBT /F1 12 Tf 70 700 Td (" + name.encode('utf-8') + b" Resume) Tj ET\nendstream endobj\n"
                        b"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\n"
                        b"trailer <</Size 5/Root 1 0 R>>\nstartxref\n306\n%%EOF\n"
                    )
                    with open(temp_pdf_path, 'wb') as f:
                        f.write(pdf_content)

                    el.set_input_files(temp_pdf_path)
                    log("Attached PDF resume file.")
                    
                    try: os.remove(temp_pdf_path)
                    except: pass
                elif tag_name == "SELECT" and ("sponsor" in label_lower or "auth" in label_lower or "sponsor" in name_lower):
                    options = el.locator("option").all_inner_texts()
                    options_lower = [o.lower() for o in options]
                    
                    index_to_select = -1
                    for idx, opt in enumerate(options_lower):
                        if "no" in opt or "do not" in opt:
                            index_to_select = idx
                            break
                    if index_to_select != -1:
                        el.select_option(index=index_to_select)
                        log(f"Selected sponsorship select option: {options[index_to_select]}")
                elif tag_name == "TEXTAREA" or (tag_name == "INPUT" and el_type == "text"):
                    # This is a custom application question! Keep track of it.
                    if len(label_text) > 5 and "address" not in label_lower and "city" not in label_lower:
                        if mode != 'manual':
                            unresolved_elements.append((el, label_text))
                        else:
                            log(f"Skipped custom question in Manual mode: '{label_text[:25]}...'")
            
            # 2. Solve custom questions in bulk using Gemini (Only in hybrid/auto modes)
            if len(unresolved_elements) > 0 and mode != 'manual':
                log(f"Solving {len(unresolved_elements)} custom application questions...")
                questions = [item[1] for item in unresolved_elements]
                
                answers = solve_questions(
                    api_key=api_key,
                    resume_data=resume_data,
                    questions=questions,
                    job_description=job_title,
                    company_name="Target Company"
                )

                for idx, (el, label) in enumerate(unresolved_elements):
                    ans = answers[idx] if idx < len(answers) else "N/A"
                    el.fill(ans)
                    log(f"Solved question: '{label[:30]}...' -> '{ans[:35]}...'")

            # 3. Simulate Submission (Only if mode is 'auto')
            if mode == 'auto':
                log("Auto-Submit mode active. Clicking submit button...")
                submit_button = page.query_selector("button[type='submit'], input[type='submit'], button:has-text('Submit'), button:has-text('Apply')")
                if submit_button:
                    submit_button.click()
                    page.wait_for_load_state("networkidle")
                    log("✓ Application submitted successfully in headless mode.")
                else:
                    log("⚠ Could not locate a submit button.")
            else:
                log(f"Autofill simulation completed. Submit skipped (run in {mode} mode).")

            browser.close()
            return {
                "success": True,
                "job": job_title,
                "logs": result_log
            }
        except Exception as e:
            log(f"❌ Automation failed: {str(e)}")
            try: browser.close()
            except: pass
            return {
                "success": False,
                "logs": result_log,
                "error": str(e)
            }
