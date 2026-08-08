from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import os
import requests
from ai_engine import solve_questions, generate_cover_letter, map_fields_fallback, parse_resume_pdf, evaluate_ats_score, generate_mock_questions, grade_mock_answer, suggest_buddy_answer, generate_career_template, generate_tailored_resume, generate_voice_interview_turn, evaluate_voice_interview, enhance_section
from automation_engine import submit_application_headless
from scraper import scrape_linkedin_jobs, scrape_indeed_jobs
app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome Extension and React Dashboard

@app.route('/sandbox.html', methods=['GET'])
def serve_sandbox():
    return send_file('sandbox.html')

@app.route('/api/solve-questions', methods=['POST'])
def api_solve_questions():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    questions = data.get('questions', [])
    job_description = data.get('jobDescription', '')
    company_name = data.get('companyName', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing. Add it in settings."}), 400
    if not resume_data or not questions:
        return jsonify({"error": "Missing resumeData or questions"}), 400

    try:
        answers = solve_questions(api_key, resume_data, questions, job_description, company_name)
        return jsonify({"answers": answers}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-cover-letter', methods=['POST'])
def api_generate_cover_letter():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    job_description = data.get('jobDescription', '')
    company_name = data.get('companyName', '')
    passcode = request.headers.get('X-Passcode') or data.get('passcode', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing. Add it in settings."}), 400
    if not resume_data or not job_description:
        return jsonify({"error": "Missing resumeData or jobDescription"}), 400

    try:
        letter = generate_cover_letter(api_key, resume_data, job_description, company_name, passcode)
        return jsonify({"coverLetter": letter}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/map-dom', methods=['POST'])
def api_map_dom():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    inputs = data.get('inputs', [])
    resume_data = data.get('resumeData', {})

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        mappings = map_fields_fallback(api_key, inputs, resume_data)
        return jsonify({"mappings": mappings}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-pdf', methods=['POST'])
def api_generate_pdf():
    # Helper to return a mock PDF for form attachment
    data = request.json or {}
    name = data.get('name', 'Candidate')
    
    # Simple valid minimal PDF stream
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n"
        b"2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj\n"
        b"3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<<>>>> endobj\n"
        b"4 0 obj <</Length 45>> stream\n"
        b"BT /F1 12 Tf 70 700 Td (" + name.encode('utf-8') + b" Resume) Tj ET\n"
        b"endstream endobj\n"
        b"xref\n"
        b"0 5\n"
        b"0000000000 65535 f\n"
        b"0000000009 00000 n\n"
        b"0000000056 00000 n\n"
        b"0000000111 00000 n\n"
        b"0000000212 00000 n\n"
        b"trailer <</Size 5/Root 1 0 R>>\n"
        b"startxref\n"
        b"306\n"
        b"%%EOF\n"
    )
    
    mem_file = io.BytesIO(pdf_content)
    return send_file(
        mem_file,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{name.replace(' ', '_')}_Resume.pdf"
    )

def clean_cover_letter_body(text, name=""):
    if not text:
        return ""
    text = text.replace('\r\n', '\n')
    lines = [line.strip() for line in text.split('\n')]
    
    # 1. Clean up opening header details (strip lines before the salutation)
    salutation_idx = 0
    for idx, line in enumerate(lines[:12]):
        line_lower = line.lower().rstrip(',. ')
        if line_lower.startswith(("dear", "to ", "to whom", "hello", "greetings")):
            salutation_idx = idx
            break
            
    if salutation_idx > 0:
        lines = lines[salutation_idx:]
        
    # 2. Clean up closing signature (strip lines starting from the closing word)
    while lines and not lines[-1]:
        lines.pop()
        
    for i in range(len(lines) - 1, max(-1, len(lines) - 6), -1):
        line = lines[i].lower().rstrip(',. ')
        if len(line) <= 25 and line in ["sincerely", "best regards", "kind regards", "regards", "respectfully", "thank you", "thanks", "best", "warmly", "warm regards", "with best regards"]:
            lines = lines[:i]
            break

    while lines and not lines[-1]:
        lines.pop()

    return "\n".join(lines)


def format_url(url):
    if not url:
        return ""
    url = url.strip()
    if not url.lower().startswith(("http://", "https://")):
        return "https://" + url
    return url


@app.route('/api/generate-cover-letter-pdf', methods=['POST'])
def api_generate_cover_letter_pdf():
    data = request.json or {}
    name = data.get('name', 'Candidate')
    email = data.get('email', '')
    phone = data.get('phone', '')
    linkedin = data.get('linkedin', '')
    github = data.get('github', '')
    company = data.get('companyName', 'Hiring Committee')
    text = data.get('text', 'Dear Hiring Manager,\n\nI am excited to apply...')
    
    linkedin_url = format_url(linkedin)
    github_url = format_url(github)
    
    # Format date
    from datetime import datetime
    date_str = datetime.now().strftime("%B %d, %Y")
    
    # Clean cover letter body of duplicate signature
    cleaned_text = clean_cover_letter_body(text, name)
    
    # Separate text into paragraph tags
    paragraphs_html = ""
    for p in cleaned_text.split('\n'):
        clean_p = p.strip()
        if clean_p:
            paragraphs_html += f"<p class='paragraph'>{clean_p}</p>\n"
            
    # Compose HTML structure styled to HIG design guidelines
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap');
    body {{
      font-family: 'EB Garamond', 'Georgia', serif;
      color: #111827;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }}
    .header {{
      text-align: center;
      margin-bottom: 20px;
    }}
    .name {{
      font-size: 22pt;
      font-weight: bold;
      color: #111111;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }}
    .contact-row {{
      font-size: 10pt;
      color: #4b5563;
      margin-bottom: 8px;
    }}
    .contact-row a {{
      color: #1e40af;
      text-decoration: underline;
    }}
    .divider {{
      border-top: 1px solid #d1d5db;
      margin-bottom: 20px;
    }}
    .recipient {{
      font-size: 11pt;
      color: #374151;
      margin-bottom: 20px;
      line-height: 1.4;
    }}
    .date {{
      font-size: 11pt;
      color: #374151;
      margin-bottom: 20px;
    }}
    .body {{
      font-size: 11pt;
      text-align: justify;
    }}
    .paragraph {{
      margin-bottom: 16px;
      text-indent: 0;
    }}
    .closing {{
      margin-top: 28px;
      line-height: 1.5;
    }}
  </style>
</head>
<body>
  <div class="header">
    <h1 class="name">{name}</h1>
    <div class="contact-row">
      {" &nbsp;•&nbsp; ".join(filter(None, [
        email,
        phone,
        f"<a href='{linkedin_url}'>LinkedIn</a>" if linkedin else None,
        f"<a href='{github_url}'>GitHub</a>" if github else None
      ]))}
    </div>
    <div class="divider"></div>
  </div>
  
  <div class="date">{date_str}</div>
  
  <div class="recipient">
    <strong>Hiring Committee</strong><br>
    {company}
  </div>
  
  <div class="body">
    {paragraphs_html}
  </div>
  
  <div class="closing">
    Sincerely,<br><br><br>
    <strong>{name}</strong>
  </div>
</body>
</html>
"""

    # Compile HTML to PDF using Playwright headless context
    pdf_bytes = b""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(html_content)
            
            # Print to PDF with clean margins
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={
                    "top": "0.75in",
                    "bottom": "0.75in",
                    "left": "0.75in",
                    "right": "0.75in"
                }
            )
            browser.close()
    except Exception as e:
        print(f"[PDF Compiler Error] Failed compiling via Playwright: {e}")
        # Fallback minimal valid PDF
        pdf_bytes = (
            b"%PDF-1.4\n"
            b"1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n"
            b"2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj\n"
            b"3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<<>>>> endobj\n"
            b"4 0 obj <</Length 200>> stream\n"
            b"BT /F1 12 Tf 70 700 Td (" + name.encode('utf-8') + b" Cover Letter) Tj ET\n"
            b"endstream endobj\n"
            b"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer <</Size 5/Root 1 0 R>>\nstartxref\n306\n%%EOF\n"
        )
        
    mem_file = io.BytesIO(pdf_bytes)
    return send_file(
        mem_file,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{name.replace(' ', '_')}_CoverLetter.pdf"
    )

@app.route('/api/generate-latex-tex', methods=['POST'])
def api_generate_latex_tex():
    data = request.json or {}
    name = data.get('name', 'Candidate')
    email = data.get('email', 'email@example.com')
    phone = data.get('phone', '')
    website = data.get('website', '')
    github = data.get('github', '')
    linkedin = data.get('linkedin', '')
    company = data.get('companyName', 'Acme Corp')
    text = data.get('text', 'Dear Hiring Manager,\n\nI am excited to apply...')

    # Escape LaTeX special characters
    def escape_latex(val):
        if not val:
            return ""
        chars = {
            "\\": "\\textbackslash{}",
            "&": "\\&",
            "%": "\\%",
            "$": "\\$",
            "#": "\\#",
            "_": "\\_",
            "{": "\\{",
            "}": "\\}",
            "~": "\\textasciitilde{}",
            "^": "\\textasciicircum{}"
        }
        for k, v in chars.items():
            val = val.replace(k, v)
        return val

    esc_name = escape_latex(name)
    esc_email = escape_latex(email)
    esc_phone = escape_latex(phone)
    esc_website = escape_latex(website)
    esc_github = escape_latex(github)
    esc_linkedin = escape_latex(linkedin)
    esc_company = escape_latex(company)
    
    # Clean cover letter body of duplicate signature
    cleaned_text = clean_cover_letter_body(text, name)
    
    paragraphs = cleaned_text.split('\n')
    latex_paragraphs = []
    for p in paragraphs:
        p_clean = p.strip()
        if p_clean:
            latex_paragraphs.append(escape_latex(p_clean))
    
    body_content = "\n\n".join(latex_paragraphs)

    # Precomputed as plain variables (rather than nested f-strings inside the
    # template below) because a backslash inside an f-string expression part
    # is a SyntaxError on Python < 3.12.
    phone_line = f"\\\\ {esc_phone}" if esc_phone else ""
    linkedin_line = f"\\\\ \\href{{{esc_linkedin}}}{{LinkedIn}}" if esc_linkedin else ""
    github_line = f"\\\\ \\href{{{esc_github}}}{{GitHub}}" if esc_github else ""

    latex_template = f"""\\documentclass[11pt,a4paper]{{letter}}
\\usepackage[utf8]{{inputenc}}
\\usepackage[left=1in,right=1in,top=1in,bottom=1in]{{geometry}}
\\usepackage{{hyperref}}
\\usepackage{{xcolor}}

\\definecolor{{primaryColor}}{{HTML}}{{4F46E5}}

\\address{{
    \\textbf{{{esc_name}}} \\\\
    \\href{{mailto:{esc_email}}}{{{esc_email}}}
    {phone_line}
    {linkedin_line}
    {github_line}
}}

\\signature{{{esc_name}}}

\\begin{{document}}
\\begin{{letter}}{{Hiring Committee \\\\ {esc_company}}}

\\opening{{Dear Hiring Team,}}

{body_content}

\\closing{{Sincerely,}}
\\end{{letter}}
\\end{{document}}
"""

    mem_file = io.BytesIO(latex_template.encode('utf-8'))
    return send_file(
        mem_file,
        mimetype='text/plain',
        as_attachment=True,
        download_name=f"{name.replace(' ', '_')}_CoverLetter.tex"
    )

@app.route('/api/parse-resume', methods=['POST'])
def api_parse_resume():
    api_key = request.headers.get('X-Gemini-Key') or request.form.get('apiKey')
    if not api_key:
        return jsonify({"error": "Gemini API Key is missing. Add it in settings first."}), 400
    
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        pdf_bytes = file.read()
        parsed_data = parse_resume_pdf(api_key, pdf_bytes)
        return jsonify(parsed_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ats-score', methods=['POST'])
def api_ats_score():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    job_description = data.get('jobDescription', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing. Add it in settings."}), 400
    if not resume_data or not job_description:
        return jsonify({"error": "Missing resumeData or jobDescription"}), 400

    try:
        score_data = evaluate_ats_score(api_key, resume_data, job_description)
        return jsonify(score_data), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/mock-coach', methods=['POST'])
def api_mock_coach():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    job_description = data.get('jobDescription', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        questions = generate_mock_questions(api_key, resume_data, job_description)
        return jsonify(questions), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/mock-coach/grade', methods=['POST'])
def api_mock_coach_grade():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    question = data.get('question', '')
    answer = data.get('answer', '')
    resume_data = data.get('resumeData', {})

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        evaluation = grade_mock_answer(api_key, question, answer, resume_data)
        return jsonify(evaluation), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/practice-interview/ai-turn', methods=['POST'])
def api_practice_interview_ai_turn():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    
    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        text = generate_voice_interview_turn(
            api_key=api_key,
            conversation=data.get('conversation', []),
            role=data.get('role', 'Software Engineer'),
            interview_type=data.get('interviewType', 'Technical'),
            difficulty=data.get('difficulty', 'Mid'),
            turn_number=data.get('turnNumber', 1),
            total_turns=data.get('totalTurns', 5),
            job_description=data.get('jobDescription', '')
        )
        return jsonify({"text": text}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/practice-interview/final-feedback', methods=['POST'])
def api_practice_interview_final_feedback():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        feedback = evaluate_voice_interview(
            api_key=api_key,
            conversation=data.get('conversation', []),
            role=data.get('role', 'Software Engineer'),
            interview_type=data.get('interviewType', 'Technical')
        )
        return jsonify(feedback), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/interview-buddy', methods=['POST'])
def api_interview_buddy():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    question = data.get('question', '')
    resume_data = data.get('resumeData', {})

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        hints = suggest_buddy_answer(api_key, question, resume_data)
        return jsonify(hints), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/career-write', methods=['POST'])
def api_career_write():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    template_type = data.get('templateType', '')
    extra_context = data.get('extraContext', '')
    passcode = request.headers.get('X-Passcode') or data.get('passcode', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        draft = generate_career_template(api_key, resume_data, template_type, extra_context, passcode)
        return jsonify(draft), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/auto-apply/submit', methods=['POST'])
def api_auto_apply_submit():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    job_url = data.get('jobUrl', '')
    mode = data.get('mode', 'hybrid')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400
    if not job_url:
        return jsonify({"error": "Missing jobUrl"}), 400

    try:
        result = submit_application_headless(api_key, resume_data, job_url, mode)
        return jsonify(result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/search-jobs', methods=['GET'])
def api_search_jobs():
    query = request.args.get('query', '')
    location = request.args.get('location', 'Remote')
    skills = request.args.get('skills', '')

    # Set default values if query is empty
    if not query:
        query = "Software Engineer"
    if not location:
        location = "Remote"

    try:
        print(f"[API] Searching jobs for query: '{query}' at location: '{location}'")
        
        # Scrape LinkedIn and Indeed listings
        linkedin_results = scrape_linkedin_jobs(query, location)
        indeed_results = scrape_indeed_jobs(query, location)
        
        all_jobs = linkedin_results + indeed_results
        
        # Calculate Personalized Match Score
        skills_list = [s.strip().lower() for s in skills.split(',') if s.strip()]
        
        for job in all_jobs:
            title_lower = job.get('title', '').lower()
            company_lower = job.get('company', '').lower()
            
            # Base match starts at 70%
            match_score = 70
            
            matched_skills = []
            if skills_list:
                for skill in skills_list:
                    if skill in title_lower or skill in company_lower:
                        match_score += 8
                        matched_skills.append(skill)
            
            # Cap score at 98%
            if match_score > 98:
                match_score = 98
                
            job['matchScore'] = match_score
            job['matchedSkills'] = matched_skills
            job['description'] = f"Personalized listing fetched from {job.get('source')} for role '{query}' at location '{location}'."
            
        # Sort by match score descending
        all_jobs.sort(key=lambda x: x.get('matchScore', 70), reverse=True)
        
        return jsonify(all_jobs[:30]), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/tailor-resume', methods=['POST'])
def api_tailor_resume():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    job_description = data.get('jobDescription', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400
    if not resume_data or not job_description:
        return jsonify({"error": "Missing resumeData or jobDescription"}), 400

    try:
        tailored = generate_tailored_resume(api_key, resume_data, job_description)
        return jsonify(tailored), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-latex-resume', methods=['POST'])
def api_generate_latex_resume():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    job_description = data.get('jobDescription', '')
    latex_template = data.get('latexTemplate', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        from ai_engine import generate_latex_resume
        result = generate_latex_resume(api_key, resume_data, job_description, latex_template)
        return jsonify(result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/rewrite-section', methods=['POST'])
def api_rewrite_section():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    section_type = data.get('sectionType', '')
    original_text = data.get('originalText', '')
    job_description = data.get('jobDescription', '')
    custom_instruction = data.get('customInstruction', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        from ai_engine import rewrite_section
        result = rewrite_section(api_key, section_type, original_text, job_description, custom_instruction)
        return jsonify(result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-resume-pdf', methods=['POST'])
def api_generate_resume_pdf():
    data = request.json or {}
    name = data.get('name', 'Candidate')
    html_content = data.get('htmlContent', '')

    if not html_content:
        return jsonify({"error": "HTML content is empty."}), 400

    import io
    pdf_bytes = b""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.set_content(html_content)
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={
                    "top": "0.4in",
                    "bottom": "0.4in",
                    "left": "0.4in",
                    "right": "0.4in"
                }
            )
            browser.close()
    except Exception as e:
        print(f"[PDF Compiler Error] Failed compiling resume: {e}")
        return jsonify({"error": str(e)}), 500

    mem_file = io.BytesIO(pdf_bytes)
    return send_file(
        mem_file,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{name.replace(' ', '_')}_Resume.pdf"
    )

@app.route('/api/generate-outreach', methods=['POST'])
def api_generate_outreach():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    resume_data = data.get('resumeData', {})
    contact_name = data.get('contactName', '')
    contact_title = data.get('contactTitle', '')
    contact_about = data.get('contactAbout', '')
    passcode = request.headers.get('X-Passcode') or data.get('passcode', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400

    try:
        from ai_engine import generate_personalized_outreach
        result = generate_personalized_outreach(api_key, resume_data, contact_name, contact_title, contact_about, passcode)
        return jsonify(result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/parse-job-details', methods=['POST'])
def api_parse_job_details():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    page_text = data.get('pageText', '')
    url = data.get('url', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400
    if not page_text:
        return jsonify({"error": "No page content provided."}), 400

    try:
        from ai_engine import parse_job_details
        result = parse_job_details(api_key, page_text, url)
        return jsonify(result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/enhance-section', methods=['POST'])
def api_enhance_section():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    section_name = data.get('sectionName', 'summary')
    text_to_enhance = data.get('textToEnhance', '')
    job_description = data.get('jobDescription', '')

    if not api_key:
        return jsonify({"error": "Gemini API Key is missing."}), 400
    if not text_to_enhance:
        return jsonify({"error": "No text provided to enhance."}), 400

    try:
        versions = enhance_section(api_key, section_name, text_to_enhance, job_description)
        return jsonify({"versions": versions}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

from recruiter_sourcing import source_candidates_headless

@app.route('/api/recruiter/search-candidates', methods=['POST'])
def api_recruiter_search_candidates():
    data = request.json or {}
    role = data.get('role', 'Fullstack Engineer')
    skills = data.get('skills', ['React', 'Python', 'AWS'])
    min_exp = data.get('minExp', '3+')
    location = data.get('location', 'San Francisco')
    platform = data.get('platform', 'github')

    try:
        candidates = source_candidates_headless(role, skills, min_exp, location, platform)
        return jsonify({"candidates": candidates}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/recruiter/generate-outreach', methods=['POST'])
def api_recruiter_generate_outreach():
    api_key = request.headers.get('X-Gemini-Key') or request.json.get('apiKey')
    data = request.json or {}
    candidate = data.get('candidate', {})
    role = data.get('role', 'Software Engineer')
    company_name = data.get('companyName', 'Our Engineering Team')

    cand_name = candidate.get('name', 'Candidate')
    cand_title = candidate.get('title', 'Engineer')
    cand_skills = ', '.join(candidate.get('skills', ['Software Development']))

    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"Write a professional, personalized recruiter outreach email/LinkedIn message to candidate {cand_name} for the role of {role} at {company_name}. Candidate background: {cand_title}, skilled in {cand_skills}. Keep it concise, engaging, and professional."
            res = model.generate_content(prompt)
            outreach_text = res.text.strip()
            return jsonify({"outreachMessage": outreach_text}), 200
        except Exception as e:
            print(f"[Outreach Generator] Gemini API error: {e}")

    # Check Hugging Face API
    hf_key = request.headers.get('X-HuggingFace-Key') or data.get('hfApiKey') or os.environ.get('HUGGINGFACE_API_KEY')
    if hf_key:
        try:
            hf_outreach = huggingface_engine.hf_generate_outreach(hf_key, cand_name, cand_title, cand_skills, role, company_name)
            return jsonify({"outreachMessage": hf_outreach}), 200
        except Exception as e:
            print(f"[Outreach Generator] Hugging Face error: {e}")

    # Fallback template if no API key
    fallback_msg = f"""Hi {cand_name},

I was really impressed by your background as a {cand_title} and your expertise in {cand_skills}.

We are currently scaling our engineering team at {company_name} and are looking for a {role} to lead key technical initiatives. Based on your experience, I think you'd be a fantastic fit.

Would you be open for a quick 15-minute introductory call this week?

Best regards,
Recruiting Team @ {company_name}"""
    return jsonify({"outreachMessage": fallback_msg}), 200

@app.route('/api/huggingface/test-connection', methods=['POST'])
def test_huggingface_connection():
    data = request.get_json() or {}
    hf_key = request.headers.get('X-HuggingFace-Key') or data.get('hfApiKey') or os.environ.get('HUGGINGFACE_API_KEY')
    if not hf_key:
        return jsonify({"success": False, "error": "Hugging Face API token missing"}), 400

    try:
        res = huggingface_engine.generate_with_huggingface(hf_key, "Say hello!")
        return jsonify({"success": True, "message": "Hugging Face API connected successfully!", "response": res}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Local dev only. In Cloud Run, gunicorn imports `app` directly (see Dockerfile)
    # and debug mode / the Flask dev server are never used.
    port = int(os.environ.get('PORT', 5005))
    app.run(host='0.0.0.0', port=port, debug=True)
