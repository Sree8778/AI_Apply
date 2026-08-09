import requests
import math
import json
import re

# Supported Hugging Face Models
HF_TEXT_MODEL = "meta-llama/Llama-3.2-3B-Instruct"
HF_ALT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"
HF_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def generate_with_huggingface(api_key, prompt, model_name=HF_TEXT_MODEL):
    """
    Generates text using Hugging Face Serverless Inference API.
    """
    if not api_key:
        raise ValueError("Hugging Face API Key is missing")

    url = f"https://api-inference.huggingface.co/models/{model_name}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.3,
            "return_full_text": False
        }
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        if res.ok:
            data = res.json()
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("generated_text", "").strip()
            elif isinstance(data, dict):
                return data.get("generated_text", "").strip()
        else:
            # Try alternate Mistral model if primary model is loading/unavailable
            alt_url = f"https://api-inference.huggingface.co/models/{HF_ALT_MODEL}"
            alt_res = requests.post(alt_url, headers=headers, json=payload, timeout=12)
            if alt_res.ok:
                data = alt_res.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("generated_text", "").strip()

            print(f"[HuggingFace Engine] HTTP Error {res.status_code}: {res.text}")
            raise RuntimeError(f"Hugging Face API returned error status {res.status_code}")
    except Exception as e:
        print(f"[HuggingFace Engine] Exception: {e}")
        raise e

def compute_cosine_similarity(vec1, vec2):
    """
    Computes cosine similarity between two float vectors.
    """
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def compute_hf_semantic_ats_score(resume_text, job_description, api_key):
    """
    Calculates ATS score using Hugging Face Sentence Embeddings (all-MiniLM-L6-v2)
    to compute semantic vector similarity between resume and job description.
    """
    if not api_key or not resume_text or not job_description:
        return None

    url = f"https://api-inference.huggingface.co/models/{HF_EMBEDDING_MODEL}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        # Request feature extraction / embeddings
        payload = {"inputs": [resume_text[:2000], job_description[:2000]]}
        res = requests.post(url, headers=headers, json=payload, timeout=10)

        if res.ok:
            embeddings = res.json()
            if isinstance(embeddings, list) and len(embeddings) >= 2:
                vec_resume = embeddings[0]
                vec_jd = embeddings[1]
                
                # Handle nested array representation
                if isinstance(vec_resume[0], list):
                    vec_resume = vec_resume[0]
                if isinstance(vec_jd[0], list):
                    vec_jd = vec_jd[0]

                similarity = compute_cosine_similarity(vec_resume, vec_jd)
                score = min(98, max(55, int(similarity * 100) + 20))
                return {
                    "score": score,
                    "similarity": round(similarity, 3)
                }
    except Exception as e:
        print(f"[HuggingFace Embeddings ATS] Exception: {e}")

    return None

def hf_enhance_section(api_key, section_name, text_to_enhance, job_description=""):
    """
    Enhances resume section text using Hugging Face Llama 3 / Mistral model.
    """
    prompt = f"You are an expert ATS resume writer. Enhance the following resume {section_name} to be impactful, quantifiable, and optimized for key job requirements.\n\nOriginal Text: {text_to_enhance}\n\nJob Description: {job_description}\n\nProvide 3 distinct enhanced bullet points. Format output clearly."
    enhanced_output = generate_with_huggingface(api_key, prompt)

    bullets = [b.strip().replace(/^[-•*]\s*/, "") for b in enhanced_output.split("\n") if b.strip()]
    if len(bullets) < 3:
        bullets = [
            f"Optimized {section_name} delivering quantifiable efficiency gains and technical excellence.",
            f"Led key engineering initiatives implementing modern software best practices.",
            f"Streamlined workflows resulting in improved team output and platform performance."
        ]

    return bullets[:3]

def hf_generate_outreach(api_key, candidate_name, candidate_title, candidate_skills, role, company_name):
    """
    Generates personalized cold recruiter outreach using Hugging Face models.
    """
    prompt = f"Write a professional, personalized recruiter outreach email to {candidate_name} ({candidate_title}, skilled in {candidate_skills}) for a {role} position at {company_name}. Keep it concise, engaging, and professional."
    outreach = generate_with_huggingface(api_key, prompt)
    return outreach
