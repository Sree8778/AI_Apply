import json
import re
import google.generativeai as genai

def generate_with_gemini(api_key, prompt):
    genai.configure(api_key=api_key)
    models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"]
    last_err = None
    for model_name in models:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            if "not found" in str(e).lower() or "404" in str(e) or "not supported" in str(e).lower():
                last_err = e
                continue
            else:
                raise e
    if last_err:
        raise last_err
    raise RuntimeError("No Gemini models could be reached.")

def parse_ai_json(text):
    """Strips markdown code-fences Gemini sometimes wraps JSON in, then parses it.

    Also repairs invalid backslash escapes: Gemini frequently returns raw LaTeX
    (full of single backslashes like \\section, \\textbf) inside a JSON string
    value. JSON only permits a fixed set of backslash escapes, so any other
    backslash makes json.loads() fail outright (e.g. "Invalid \\escape").
    """
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # Repair backslashes inside JSON double-quoted strings
    def repl(match):
        s = match.group(0)
        fixed = ""
        i = 0
        n = len(s)
        while i < n:
            if s[i] == '\\':
                if i + 1 < n and s[i+1] in ['"', '\\']:
                    fixed += s[i:i+2]
                    i += 2
                else:
                    fixed += '\\\\'
                    i += 1
            else:
                fixed += s[i]
                i += 1
        return fixed

    text = re.sub(r'"(?:[^"\\]|\\.)*"', repl, text)
    return json.loads(text)

def solve_questions(api_key, resume_data, questions, job_description="", company_name=""):
    """
    Answers custom job application questions using candidate resume data, job description, and the user's BYOK.
    """
    if not api_key:
        raise ValueError("Gemini API Key is missing. Please configure it in Settings.")

    try:
        
        prompt = f"""
        You are an AI assistant that auto-fills job applications on behalf of a candidate.
        Use the candidate's resume details to answer a list of custom application questions.
        
        Optional Job Details:
        - Company: {company_name}
        - Job Description: {job_description}

        Candidate Resume Data:
        {json.dumps(resume_data, indent=2)}

        Questions to Answer:
        {json.dumps(questions, indent=2)}

        Instructions:
        1. Respond to each question in the list.
        2. Maintain a highly professional and tailored tone.
        3. Match the answers to the job description if provided.
        4. Keep answers concise (1-2 sentences unless the question explicitly asks for a detailed description/cover letter).
        5. For boolean or choice questions (e.g. "Do you have work authorization?"), answer with "Yes", "No", or pick the most logical option based on profile.
        6. Return ONLY a valid JSON object matching this exact schema:
        {{
          "answers": [
            "answer to question 1",
            "answer to question 2"
          ]
        }}
        Do not wrap the output in markdown code blocks. Output raw JSON.
        """

        text = generate_with_gemini(api_key, prompt)
        result = parse_ai_json(text)
        return result.get("answers", ["N/A" for _ in questions])
    except Exception as e:
        print(f"[AI ENGINE] Error solving questions: {e}")
        raise RuntimeError(f"Gemini API Error: {str(e)}")

def generate_cover_letter(api_key, resume_data, job_description, company_name="", passcode=""):
    """
    Generates a tailored cover letter using the provided BYOK.
    """
    if not api_key:
        raise ValueError("Gemini API Key is missing. Please configure it in Settings.")

    try:

        prompt = f"""
        You are an AI assistant helping a candidate write a highly personalized cover letter.
        Use the candidate's resume and target job details.

        Target Company: {company_name}
        Job Description: {job_description}

        Candidate Resume Data:
        {json.dumps(resume_data, indent=2)}

        Instructions:
        1. Write a professional, compelling, and tailored cover letter.
        2. Keep the letter body to exactly 3 paragraphs (Introduction, 1 deep-dive Core Body Paragraph, and a call-to-action Conclusion). Limit each paragraph to 3-4 sentences maximum. The entire letter body must be highly concise to fit on exactly a single page.
        3. Emphasize matches between the candidate's skills and the job requirements.
        4. Do NOT include any header block (your name, email, phone, address, date, or recipient company details) at the top. The layout already renders these dynamically. Start directly with the salutation: 'Dear Hiring Manager,' or 'Dear [Company Name] Hiring Team,'.
        5. Do NOT include any closing signature (like 'Sincerely,' or 'Sincerely, [Your Name]') at the end. Stop writing immediately after the last sentence of your final body paragraph.
        """

        return generate_with_gemini(api_key, prompt)
    except Exception as e:
        print(f"[AI ENGINE] Error generating cover letter: {e}")
        raise RuntimeError(f"Gemini API Error: {str(e)}")

def map_fields_fallback(api_key, pruned_inputs, resume_data):
    """
    Identifies mapping for ambiguous form inputs using Gemini.
    """
    if not api_key:
        raise ValueError("Gemini API Key is missing.")

    try:

        prompt = f"""
        You are an advanced DOM parsing assistant. Given a list of unresolved form input elements, 
        map them to the corresponding path in the candidate's resume/profile schema.

        Unresolved Input Fields:
        {json.dumps(pruned_inputs, indent=2)}

        Available Candidate Profile Keys:
        - personal.name
        - personal.email
        - personal.phone
        - personal.location
        - personal.website
        - personal.github
        - personal.linkedin
        - summary (professional bio)
        - skills (array of skills)
        - work_history (array of objects with role, company, description, dates)
        - education (degree, school, major)

        Instructions:
        1. For each input in the list, map it to the most relevant Candidate Profile Key.
        2. If a field cannot be mapped or does not fit, map it to "custom_question".
        3. Return ONLY a valid JSON object matching this schema:
        {{
          "mappings": {{
            "input_id_or_name_1": "candidate_profile_key",
            "input_id_or_name_2": "custom_question"
          }}
        }}
        Do not wrap the output in markdown code blocks. Output raw JSON.
        """

        text = generate_with_gemini(api_key, prompt)
        
        result = parse_ai_json(text)
        return result.get("mappings", {})
    except Exception as e:
        print(f"[AI ENGINE] DOM field mapping failed: {e}")
        return {}

import io
from pypdf import PdfReader

def parse_resume_pdf(api_key, pdf_bytes):
    """
    Extracts text from a PDF file and structures it into the Candidate Profile JSON using Gemini.
    """
    if not api_key:
        raise ValueError("Gemini API Key is missing.")

    try:
        # Extract text from PDF bytes
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
        
        extracted_text = extracted_text.strip()
        if not extracted_text:
            raise ValueError("No text could be extracted from the uploaded PDF resume.")

        # Configure Gemini and get structure

        prompt = f"""
        You are an expert AI recruiter assistant. Parse the following extracted resume text 
        and map it to the exact Candidate Profile JSON schema specified below.

        Resume Text:
        ---
        {extracted_text}
        ---

        Expected Schema:
        {{
          "personal": {{
            "name": "Full Name",
            "email": "Email Address",
            "phone": "Phone Number",
            "website": "Portfolio or personal website URL",
            "github": "GitHub URL",
            "linkedin": "LinkedIn URL"
          }},
          "summary": "Professional summary or biography (max 3 sentences)",
          "skills": ["Skill 1", "Skill 2", ...],
          "work_history": [
            {{
              "role": "Job Title",
              "company": "Company Name",
              "dates": "Employment Dates",
              "achievements": ["Achievement 1", "Achievement 2", ...]
            }}
          ],
          "projects": [
            {{
              "name": "Project Name",
              "dates": "Project Dates or duration (e.g. 2024 or 05/2024 - 08/2024 or left empty if none)",
              "achievements": ["Achievement 1 / Bullet Point 1", "Achievement 2 / Bullet Point 2", ...]
            }}
          ],
          "education": [
            {{
              "institution": "School or university name",
              "degree": "Degree and major (e.g., Bachelor of Science in Computer Science)",
              "dates": "Graduation date or duration"
            }}
          ]
        }}

        Instructions:
        1. For work history and projects, extract ALL bullet points, achievements, and key highlights from the resume. Each logical achievement/bullet point MUST be listed as a separate, individual string in the "achievements" array. Do NOT combine multiple bullet points into a single long sentence or a single paragraph. If the original resume text or PDF extraction merges them into a single line, split them semantically into separate logical achievements (e.g., separating by action verbs like "Engineered", "Developed", "Implemented", "Created", "Optimized", "Visualized", etc., or by clauses).
        2. Keep the raw content identical to the resume text without shortening it.
        3. Ensure all fields map accurately to the text. If a field (like website or github) is not found, leave it as an empty string "".
        4. Do not make up information.
        5. Return ONLY the raw JSON object. Do not wrap in markdown block backticks.
        """

        text = generate_with_gemini(api_key, prompt)
        
        result = parse_ai_json(text)
        return result
    except Exception as e:
        print(f"[AI ENGINE] Resume parsing failed: {e}")
        raise RuntimeError(f"Resume Parsing Error: {str(e)}")

def evaluate_ats_score(api_key, resume_data, job_description):
    """
    Evaluates resume match score against a Job Description, identifies missing keywords, and suggests optimization.
    """
    prompt = f"""
    You are an ATS (Applicant Tracking System) optimizer. Compare the Candidate's Resume against the target Job Description.
    
    Candidate Resume Details:
    {json.dumps(resume_data, indent=2)}

    Target Job Description:
    {job_description}

    Instructions:
    1. Calculate an overall Match Score (0 to 100).
    2. Extract a list of critical "Missing Keywords" (technologies, tools, methodologies present in the JD but not found or weak in the resume).
    3. Generate a tailored professional summary (max 3 sentences) optimized for this specific job description.
    4. Return ONLY a valid JSON object matching this exact schema:
    {{
      "score": 85,
      "missingKeywords": ["Keyword1", "Keyword2"],
      "tailoredSummary": "A tailored professional summary..."
    }}
    Do not wrap the output in markdown block backticks. Output raw JSON.
    """
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] ATS scoring failed: {e}")
        raise RuntimeError(f"ATS Optimization Error: {str(e)}")

def generate_mock_questions(api_key, resume_data, job_description):
    """
    Generates 5 behavioral and technical interview questions based on candidate resume and target JD.
    """
    prompt = f"""
    You are a technical recruiter. Based on the Candidate's Resume and target Job Description, 
    generate 5 tailored interview questions. Mix behavioral (STAR format expected) and technical domain questions.

    Candidate Resume:
    {json.dumps(resume_data, indent=2)}

    Job Description:
    {job_description}

    Return ONLY a valid JSON object matching this schema:
    {{
      "questions": [
        "Question 1",
        "Question 2",
        "Question 3",
        "Question 4",
        "Question 5"
      ]
    }}
    Do not wrap output in markdown backticks.
    """
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] Question generation failed: {e}")
        raise RuntimeError(f"Mock Question Error: {str(e)}")

def grade_mock_answer(api_key, question, answer, resume_data):
    """
    Evaluates a candidate's response to a mock interview question.
    """
    prompt = f"""
    You are an expert interview coach. Grade the candidate's response to the interview question below.
    Compare the response against their resume experience and provide guidance.

    Interview Question:
    {question}

    Candidate's Answer:
    {answer}

    Candidate's Resume Context:
    {json.dumps(resume_data, indent=2)}

    Instructions:
    1. Grade the answer on a scale from 0 to 100.
    2. Provide constructive feedback focusing on STAR alignment, clarity, grammar, and completeness.
    3. Output 2-3 specific bullet points of "Suggested Improvement" to make the answer stronger.
    4. Return ONLY a valid JSON object matching this schema:
    {{
      "score": 75,
      "feedback": "Overall good answer...",
      "clarity": "Good clarity but missing key metrics...",
      "grammar": "Excellent grammar.",
      "suggestedImprovement": [
        "Include metrics showing quantitative impact...",
        "Structure with clearer situation details..."
      ]
    }}
    Do not wrap output in markdown backticks.
    """
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] Answer grading failed: {e}")
        raise RuntimeError(f"Grading Engine Error: {str(e)}")

def suggest_buddy_answer(api_key, question, resume_data):
    """
    Suggests 3 key bullet points for the user to answer a live interview question.
    """
    prompt = f"""
    You are an interactive live interview assistant. The user is currently in a live interview and was asked the question below.
    Extract 3 core talking points/hints from their resume that they can mention to answer this question effectively.

    Interviewer Question:
    {question}

    Candidate Resume Context:
    {json.dumps(resume_data, indent=2)}

    Instructions:
    1. Keep hints concise, punchy, and easy to read in a glance.
    2. Reference real achievements/skills from their resume details.
    3. Return ONLY a valid JSON object matching this schema:
    {{
      "hints": [
        "Mention your experience with X at company Y where you did Z...",
        "Bring up your skills in A, B, and C...",
        "Talk about how you optimized metrics by 40%..."
      ]
    }}
    Do not wrap output in markdown backticks.
    """
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] Interview Buddy failed: {e}")
        return {"hints": ["Highlight your technical core skills.", "Reference your previous work accomplishments.", "Mention metrics or direct impacts."]}

def generate_career_template(api_key, resume_data, template_type, extra_context="", passcode=""):
    """
    Compiles standard STAR story, outreach template, or salary negotiation scripts.
    """

    prompt = f"""
    You are a career writer. Draft a professional document of type: "{template_type}".
    Use the candidate's resume and extra context details.

    Candidate Resume Context:
    {json.dumps(resume_data, indent=2)}

    Extra Parameters/Context:
    {extra_context}

    Instructions:
    1. Draft a professional template or response.
    2. For "STAR Story": Write a structured story (Situation, Task, Action, Result) based on their resume highlights.
    3. For "LinkedIn Outreach": Write a short, warm, and compelling outreach message to a recruiter or hiring manager.
    4. For "Salary Negotiation": Write a polite and firm email requesting base salary adjustments using industry values.
    5. Return ONLY a valid JSON object matching this schema:
    {{
      "text": "The compiled draft content..."
    }}
    Do not wrap output in markdown backticks.
    """
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] Career writing failed: {e}")
        raise RuntimeError(f"Career Write Error: {str(e)}")

def generate_tailored_resume(api_key, resume_data, job_description):
    """
    Compiles a tailored, high-impact resume in Markdown format.
    """
    prompt = f"""
    You are a professional resume writer and ATS consultant.
    Generate a tailored, high-impact resume in Markdown format for the candidate based on their profile and the target job description.

    Candidate Profile:
    {json.dumps(resume_data, indent=2)}

    Target Job Description:
    {job_description}

    Instructions:
    1. Tailor the professional summary, skills, and work experience bullet points to align closely with the target job description.
    2. Maintain clean, professional Markdown formatting.
    3. Do NOT include any placeholders or comments.
    4. Focus on quantitative achievements where possible.
    5. Return ONLY a valid JSON object matching this schema:
    {{
      "markdown": "# Candidate Name\\n\\n... rest of the markdown resume content ..."
    }}
    Do not wrap output in markdown backticks.
    """
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] Resume tailoring failed: {e}")
        raise RuntimeError(f"Resume Tailoring Error: {str(e)}")

def generate_voice_interview_turn(
    api_key,
    conversation,
    role,
    interview_type,
    difficulty,
    turn_number,
    total_turns,
    job_description=""
):
    """
    Generate a natural, conversational, spoken AI interviewer response using Gemini.
    """
    recent = conversation[-10:]
    history_lines = []
    for t in recent:
        tag = "[INTERVIEWER]" if t.get("role") == "ai" else "[CANDIDATE]"
        history_lines.append(f"{tag} {t.get('text', '').strip()}")
    history_str = "\n".join(history_lines)

    last_candidate = next(
        (t.get("text", "").strip() for t in reversed(conversation) if t.get("role") == "user"),
        ""
    )

    ai_questions = [t.get("text", "") for t in conversation if t.get("role") == "ai"]
    covered = " | ".join(ai_questions[-3:]) if ai_questions else "none"

    difficulty_ctx = {
        "Junior":  "Candidate is entry-level — focus on fundamentals and eagerness to learn.",
        "Mid":     "Candidate has 2–5 years experience — dig into real project examples.",
        "Senior":  "Candidate is senior — explore system design, trade-offs, and leadership.",
    }.get(difficulty, "")

    type_ctx = {
        "Technical":  f"Technical interview for {role}. Ask about relevant tech stack, system design, debugging, or algorithms.",
        "Behavioral": "Behavioral interview. Use 'Tell me about a time...' format. Focus on conflict, leadership, failure, or teamwork.",
        "HR":         "HR interview. Explore career goals, motivation, culture fit, or strengths/weaknesses.",
        "Mixed":      f"Mix technical and behavioral. Alternate between {role}-specific tech questions and situational questions.",
    }.get(interview_type, "")

    jd_snippet = ""
    if job_description and job_description.strip():
        jd_text = job_description.strip()[:800]
        jd_snippet = f"\nJob description context:\n{jd_text}\n"

    if not conversation:
        prompt = f"""You are Alex, a senior {role} interviewer starting a live {interview_type} interview.
{jd_snippet}
Say exactly three things as natural spoken sentences:
1. Introduce yourself: "Hey, I'm Alex, I'll be your interviewer today."
2. One warm sentence to put the candidate at ease.
3. Ask ONLY this single question: "Could you start by telling me a bit about yourself?"

Write only what Alex says out loud. No markdown, no speaker labels, no bullet points. Complete every sentence."""

    elif turn_number > total_turns:
        prompt = f"""You are Alex, the interviewer. The interview is wrapping up.
The candidate just said: "{last_candidate}"

Say 2 natural sentences:
- Acknowledge one specific thing they said.
- Thank them and let them know next steps are coming.

Write only what Alex says. No markdown. Complete every sentence."""

    else:
        prompt = f"""You are Alex, a {difficulty} {role} interviewer. This is turn {turn_number} of {total_turns} in a live {interview_type} interview.
{jd_snippet}
Conversation so far:
{history_str}

The candidate just said: "{last_candidate}"
Topics already covered (do not repeat): {covered}

Write Alex's next spoken response in exactly 3 sentences:
Sentence 1: React to ONE specific thing the candidate said. Do NOT say "Great answer!" — react like a real person, e.g. "Oh right, so you were dealing with X..." or "Yeah, that trade-off comes up a lot..."
Sentence 2: Transition naturally: "So my next question is..." or "Let me ask you about..." or "On that note..."
Sentence 3: Ask EXACTLY ONE question. {type_ctx} {difficulty_ctx}

STRICT RULES:
- Your entire response must end with exactly ONE question mark. Count before submitting.
- Do NOT ask two questions. Do NOT add "and also..." or "could you also tell me..." after your question.
- Write only spoken words. No bullet points, no markdown, no labels.
- Complete every sentence — never stop mid-sentence."""

    try:
        raw = generate_with_gemini(api_key, prompt)
        
        import re as _re
        raw = _re.sub(
            r"^(Alex:|INTERVIEWER:|Here(?:'s| is)(?: Alex(?:'s)?)? (?:response|reply|turn|next (?:question|response))[:\s]*)",
            "", raw, flags=_re.IGNORECASE
        ).strip()
        raw = _re.sub(r"Sentence\s*\d+[:.]\s*", " ", raw, flags=_re.IGNORECASE).strip()

        q_count = raw.count("?")
        if q_count > 2:
            first = raw.index("?")
            second = raw.index("?", first + 1)
            raw = raw[:second + 1].strip()

        return raw
    except Exception as e:
        print(f"[AI ENGINE] Voice turn failed: {e}")
        return "That's really interesting. Can you walk me through how you'd approach that from scratch?"

def evaluate_voice_interview(api_key, conversation, role, interview_type):
    """
    Evaluate the full voice interview conversation transcript.
    """
    qa_pairs = []
    ai_turns = [t for t in conversation if t.get("role") == "ai"]
    user_turns = [t for t in conversation if t.get("role") == "user"]
    for i, ans in enumerate(user_turns):
        q = ai_turns[i].get("text", "") if i < len(ai_turns) else ""
        qa_pairs.append({"question": q, "answer": ans.get("text", "")})

    # Built as a plain variable rather than inline in the f-string below: a
    # backslash inside an f-string expression part is a SyntaxError on
    # Python < 3.12.
    transcript_text = "\n".join(
        f'Q{i+1}: {p["question"]}\nA{i+1}: {p["answer"]}' for i, p in enumerate(qa_pairs)
    )
    prompt = f"""You are an expert career coach. Evaluate this {interview_type} interview for a {role} position.

Interview transcript:
{transcript_text}

Return ONLY a valid JSON object matching this schema:
{{
  "overallScore": <1-10 float, e.g. 7.5>,
  "rating": "<Poor|Fair|Good|Excellent>",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "questionScores": [score 1-10 per answer, e.g. [7, 8, 6]],
  "summary": "2-3 sentence overall coaching summary"
}}
Output raw JSON, no markdown backticks.
"""
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] Voice evaluation failed: {e}")
        return {
            "overallScore": 6.0, "rating": "Good",
            "strengths": ["Engaged throughout", "Addressed questions"],
            "improvements": ["Add more concrete examples", "Structure answers clearly"],
            "questionScores": [6] * len(user_turns),
            "summary": "Good effort overall. Focus on specific examples and structured answers."
        }

def generate_latex_resume(api_key, resume_data, job_description, latex_template):
    """
    Tailors the candidate's resume content based on the target Job Description and compiles it into the user's master LaTeX template.
    """
    if not api_key:
        raise ValueError("Gemini API Key is missing.")

    prompt = f"""
    You are an expert resume writer. Your goal is to follow every instruction below, think step by step and create realistic, interview-ready resumes that pass ATS systems with 80%+ keyword matching.

    Candidate Profile:
    {json.dumps(resume_data, indent=2)}

    Target Job Description:
    {job_description}

    Master LaTeX Template:
    ```latex
    {latex_template}
    ```

    Core Principles:
    1. Achievement Formula: [Action Verb] + [What] + [Tool/Method] + [Quantified Result] + [Unquantified Business Impact]. Focus on measured technical outcomes.
    2. Action Verbs: Built, Developed, Implemented, Created, Designed, Engineered, Configured, Optimized, Enhanced, Improved, Integrated, Automated, Streamlined, Deployed, Delivered, Shipped, Migrated, Refactored, Modernized.
    3. Metrics: Tailor and optimize metrics based strictly on the candidate's real work history. Do not invent completely new companies or roles not found in the Candidate Profile.
    4. Front-load highest-priority keywords from the Job Description in the experience bullet points.
    5. Skills section: Group the candidate's actual skills into appropriate categories and sort them by relevance to the target job description.
    6. Projects Section: Output ONLY projects that are present in the candidate's actual projects list. If the candidate has no projects, leave the Projects section empty or omit it. Do NOT make up new project names or descriptions that are not in the candidate's profile.
    7. Professional Summary: Use this template: "[Job Title] with [X]+ years of experience in [relevant domain]. Proven expertise in [2-3 key technologies from job description] with demonstrated success in [relevant business outcome]."

    Instructions:
    1. Read the job description carefully to identify all keywords.
    2. Maintain all formatting, spacing, styling, and structural elements of the Master LaTeX Template. Substitute ONLY the contents inside placeholders (Professional Summary, Technical Skills list, Work Experience items, Projects, Certifications).
    3. Ensure the content fits on exactly 2 pages when compiled.
    4. Provide the exact same tailored content (achievements, projects, summary, skills) that you generated for the LaTeX code inside a structured JSON property "tailoredResumeData" matching the candidate profile schema. Ensure the fields are fully populated so the UI can preview it.
    5. CRITICAL for diffing: "tailoredResumeData.work_history" and "tailoredResumeData.projects" MUST contain exactly the same entries, in exactly the same order, as the Candidate Profile (same companies, roles, durations, project names). Only rewrite the achievement bullet texts within each entry. Do not add, remove, or reorder entries.
    6. Extract the 10 to 25 most critical hard-skill keywords from the Job Description (technologies, tools, methodologies, certifications — not soft skills) into "jdKeywords".
    7. Return ONLY a valid JSON object matching this schema:
    {{
      "latex": "... fully substituted compile-ready LaTeX code ...",
      "atsScore": 95,
      "jdKeywords": ["Keyword1", "Keyword2"],
      "tailoredResumeData": {{
        "summary": "... tailored professional summary ...",
        "personal": {{
          "name": "...",
          "phone": "...",
          "email": "...",
          "linkedin": "...",
          "github": "...",
          "website": "...",
          "location": "..."
        }},
        "skills": [
          "..."
        ],
        "work_history": [
          {{
            "position": "...",
            "company": "...",
            "duration": "...",
            "achievements": [
              "..."
            ]
          }}
        ],
        "projects": [
          {{
            "name": "...",
            "duration": "...",
            "achievements": [
              "..."
            ]
          }}
        ],
        "education": [
          {{
            "institution": "...",
            "degree": "...",
            "duration": "..."
          }}
        ]
      }}
    }}
    Do not wrap output in markdown backticks.
    """
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] LaTeX Resume Generation failed: {e}")
        raise RuntimeError(f"LaTeX Resume Generator Error: {str(e)}")

def rewrite_section(api_key, section_type, original_text, job_description, custom_instruction):
    """
    Tailors or rewrites a specific resume section using Gemini.
    """
    if not api_key:
        raise ValueError("Gemini API Key is missing.")

    prompt = f"""
    You are an expert resume writer. Rewrite the following resume section: "{section_type}".
    
    Original Content:
    {original_text}
    
    Target Job Description (for keyword mapping and tailoring context):
    {job_description}
    
    User Custom Instructions (if any, follow this strictly):
    {custom_instruction}
    
    Core Rules:
    1. Output ONLY the rewritten text, formatted in clean HTML (e.g. paragraphs <p>, list items <li>).
    2. Maintain truthfulness to the original work history; do not invent fake company names or dates.
    3. Use active, strong verbs (e.g. Led, Developed, Architected) and quantify results where possible.
    
    Do not wrap output in markdown code blocks. Just return the raw rewritten HTML.
    """
    text = generate_with_gemini(api_key, prompt)
    if text.startswith("```html"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return {"rewrittenText": text.strip()}

def generate_personalized_outreach(api_key, resume_data, contact_name, contact_title, contact_about, passcode):
    """
    Generates personalized recruiter/hiring manager or tech lead outreach emails and LinkedIn connection messages.
    """
    if not api_key:
        raise ValueError("Gemini API Key is missing.")

    prompt = f"""
    You are an expert career consultant. Your task is to analyze the target contact's role and about section, detect if they are a recruiter/HR/hiring manager OR a technical leader/manager/software engineer, and generate a personalized LinkedIn connection message and a copy-paste friendly outreach email.

    Candidate Resume Context:
    {json.dumps(resume_data, indent=2)}

    Recipient Context:
    - Name: {contact_name}
    - Role/Title: {contact_title}
    - LinkedIn About: {contact_about}

    Detection Logic:
    1. Recruiter/Hiring Manager/Talent Acquisition Detection:
       Keywords in Title/About: "Recruiter," "Talent Acquisition," "HR," "Hiring Manager," "People Operations," "Human Resources"
       -> Target: Recruiter Templates
    2. Technical Lead/Manager Detection:
       Keywords in Title/About: "Senior," "Lead," "Principal," "Staff," "Engineering Manager," "Tech Lead," "CTO," "VP Engineering," "Director"
       -> Target: Technical Lead Templates

    Outreach Content Templates:

    *LinkedIn Recruiter Message Template:*
    "Hi [Name], I applied for the [Job Title] role and wanted to reach out directly. I'm a [My background] passionate about [relevant area from JD and resume]. Would appreciate connecting to discuss the opportunity. Thanks!"

    *LinkedIn Tech Lead Message Template:*
    "Hi [Name], I noticed your background in [specific detail from their profile]. I'm a [your role] exploring opportunities in [industry/company type]. Would love to connect and learn from your experience at [company]. Thanks!"

    *Email Recruiter Template:*
    Subject Line: (Separated, no markdown bolds)
    Body:
    "Hi [RECRUITER NAME],
    I'm writing regarding the [JOB TITLE] position [Job ID: #]
    Quick background: [MY CURRENT ROLE] with [X years] experience in [RELEVANT SKILLS/INDUSTRY]. Key highlights that align with your requirements:
    - [SPECIFIC REQUIREMENT FROM JOB POSTING] - [Your relevant experience]
    - [ANOTHER KEY REQUIREMENT] - [Your matching qualification] 
    - [THIRD REQUIREMENT] - [Your achievement/experience]
    Attached: My resume for your review.
    My question: What's the next step in your process, and is there any additional information I can provide to strengthen my application?
    I'm available for a phone screen at your convenience.
    Best regards,
    Sumanth Varma Gadiraju"

    *Email Lead SWE/Manager Template:*
    Subject Line: (Separated, no markdown bolds)
    Body:
    "Hi [NAME],
    [PERSONALIZED HOOK - derived from their About section or role]
    I'm reaching out because [SPECIFIC CONNECTION to their background/company/role].
    Quick context: I'm a [MY BACKGROUND] with [SPECIFIC ACHIEVEMENT] applying for [SPECIFIC ROLE] at [COMPANY].
    Instead of generic questions, I'm curious about [ROLE-SPECIFIC INTELLIGENT QUESTION]:
    "[THOUGHT-PROVOKING QUESTION TAILORED TO THEIR EXPERTISE]"
    I've [RELEVANT EXPERIENCE/ACHIEVEMENT] and would value your perspective.
    Worth a 10-minute conversation anytime this week?
    Best,
    Sumanth Varma Gadiraju
    P.S. [LINKEDIN CONNECTION MENTION i ALREADY SENT CONNECTION REQUEST]"

    Email Formatting Rules:
    - NO bold formatting (do NOT use **text**) anywhere in the email body or subject line.
    - Keep output plain text for Gmail/LinkedIn copy-paste compatibility.
    - Provide the subject line separately.

    Output Schema:
    Return ONLY a valid JSON object matching this schema (do not wrap in markdown backticks):
    {{
      "detectedRole": "Recruiter" or "Technical Lead",
      "linkedinMessage": "...",
      "emailSubject": "...",
      "emailBody": "..."
    }}
    """
    try:
        text = generate_with_gemini(api_key, prompt)
        return parse_ai_json(text)
    except Exception as e:
        print(f"[AI ENGINE] Outreach generation failed: {e}")
        raise RuntimeError(f"Outreach Generator Error: {str(e)}")

def parse_job_details(api_key, page_text, url=""):
    """
    Parses a job description page's text using Gemini to extract the Job Title, Company Name, and Job Description.
    """
    if not api_key:
        raise ValueError("Gemini API Key is missing.")

    prompt = f"""
    You are an expert AI job parser. Analyze the following webpage text content and extract the job application details.
    
    Source URL: {url}
    
    Webpage Content:
    {page_text[:12000]}
    
    Extract the following details:
    1. Target Job Title (e.g. "Senior Software Engineer")
    2. Company Name (e.g. "Google")
    3. The complete Job Description details (the description text, core duties, and qualification requirements).
    
    Instructions:
    - If the company name is not explicitly mentioned but can be inferred, extract it. Otherwise, default to "Unknown Company".
    - If the job title is not explicitly clear, default to "Software Engineer".
    - Respond ONLY with a valid JSON object matching the following schema:
    {{
      "title": "extracted job title",
      "company": "extracted company name",
      "description": "extracted job description text"
    }}
    Do not wrap the output in markdown code blocks. Output raw JSON.
    """

    try:
        text = generate_with_gemini(api_key, prompt)
        result = parse_ai_json(text)
        return result
    except Exception as e:
        print(f"[AI ENGINE] Error parsing job details: {e}")
        # Return fallback values
        return {
            "title": "Job Position",
            "company": "Company",
            "description": page_text[:2000]
        }

def enhance_section(api_key, section_name, text_to_enhance, job_description=""):
    """
    CareerCraft AI Enhancement engine.
    Generates 3 distinct high-impact variations for a specific section or bullet:
    - Version 1: Metrics & Results Focused
    - Version 2: ATS Keyword & Active Verb Dense
    - Version 3: Concise Executive / Leadership Tone
    """
    prompt = f"""
    You are an expert resume writer and ATS optimization specialist.
    Enhance the following section/bullet point from a candidate's resume.
    
    Section Type: {section_name}
    Original Text: "{text_to_enhance}"
    {"Target Job Description Context: " + job_description if job_description else ""}
    
    Provide 3 distinct, highly effective rewrites:
    1. Metrics & Results Focused: Emphasize quantifiable metrics, ROI, and business outcomes.
    2. ATS Keyword & Active Verb Dense: Use strong action verbs, technical/industry terminology, and keyword density.
    3. Concise Executive Tone: Polished, punchy, high-level professional phrasing.
    
    Return ONLY a valid JSON object matching this schema:
    {{
      "versions": [
        "Version 1 (Metrics & Results)",
        "Version 2 (ATS Verb & Keyword Dense)",
        "Version 3 (Concise Executive Tone)"
      ]
    }}
    Do not wrap the output in markdown code blocks.
    """

    try:
        text = generate_with_gemini(api_key, prompt)
        res = parse_ai_json(text)
        if isinstance(res, dict) and "versions" in res and isinstance(res["versions"], list):
            return res["versions"][:3]
        elif isinstance(res, list):
            return res[:3]
    except Exception as e:
        print(f"[AI ENGINE] Error in enhance_section: {e}")

    # Fallback variations
    return [
        f"{text_to_enhance} (Optimized with metrics and quantified impact)",
        f"{text_to_enhance} (Enhanced with active verbs and key technical competencies)",
        f"{text_to_enhance} (Refined for concise executive presentation)"
    ]

