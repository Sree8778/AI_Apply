import requests
import math
import json
import re

# Supported Hugging Face Models
HF_PRIMARY_MODEL = "meta-llama/Llama-3.2-3B-Instruct"
HF_ALT_MODELS = [
    "mistralai/Mistral-7B-Instruct-v0.3",
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Meta-Llama-3-8B-Instruct"
]
HF_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def verify_hf_token(api_key):
    """
    Verifies a Hugging Face API Token using the official whoami-v2 endpoint.
    Supports all HF User Access Token types (Read, Fine-Grained, Write).
    """
    if not api_key:
        return {"success": False, "error": "Hugging Face API key is missing"}

    api_key = api_key.strip()
    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        res = requests.get("https://huggingface.co/api/whoami-v2", headers=headers, timeout=10)
        if res.ok:
            user_data = res.json()
            username = user_data.get("name", "User")
            user_type = user_data.get("type", "user")
            return {
                "success": True,
                "message": f"Connected to Hugging Face as {username} ({user_type})",
                "user": username,
                "type": user_type
            }
        elif res.status_code in [401, 403]:
            return {"success": False, "error": "Invalid Hugging Face API Token. Please check your token on huggingface.co/settings/tokens"}
        else:
            return {"success": False, "error": f"Hugging Face WhoAmI returned HTTP {res.status_code}: {res.text}"}
    except Exception as e:
        print(f"[HuggingFace WhoAmI Exception]: {e}")
        # Fallback to simple inference generation test if whoami endpoint is blocked
        try:
            gen_res = generate_with_huggingface(api_key, "Test prompt")
            if gen_res:
                return {"success": True, "message": "Hugging Face Inference API connected successfully!"}
        except Exception as gen_err:
            return {"success": False, "error": str(gen_err)}

    return {"success": False, "error": "Hugging Face Token verification failed"}

def generate_with_huggingface(api_key, prompt, model_name=HF_PRIMARY_MODEL):
    """
    Generates text using Hugging Face Serverless Inference API with multi-model failover.
    """
    if not api_key:
        raise ValueError("Hugging Face API Key is missing")

    api_key = api_key.strip()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # 1. Try Chat Completions Router Endpoint
    router_url = "https://router.huggingface.co/hf-inference/v1/chat/completions"
    router_payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 512,
        "temperature": 0.3
    }
    try:
        r_res = requests.post(router_url, headers=headers, json=router_payload, timeout=12)
        if r_res.ok:
            r_data = r_res.json()
            choices = r_data.get("choices", [])
            if choices and len(choices) > 0:
                msg = choices[0].get("message", {}).get("content", "")
                if msg.strip():
                    return msg.strip()
    except Exception as e:
        print(f"[HF Router Exception]: {e}")

    # 2. Try Standard Serverless Inference URL for primary model + alt models
    models_to_try = [model_name] + [m for m in HF_ALT_MODELS if m != model_name]
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.3,
            "return_full_text": False
        }
    }

    for target_model in models_to_try:
        url = f"https://api-inference.huggingface.co/models/{target_model}"
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            if res.ok:
                data = res.json()
                if isinstance(data, list) and len(data) > 0:
                    text_out = data[0].get("generated_text", "").strip()
                    if text_out:
                        return text_out
                elif isinstance(data, dict):
                    text_out = data.get("generated_text", "").strip()
                    if text_out:
                        return text_out
        except Exception as err:
            print(f"[HF Model {target_model} Exception]: {err}")
            continue

    raise RuntimeError("Hugging Face Serverless Inference unavailable across all model endpoints. Please check token permissions.")

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

    api_key = api_key.strip()
    url = f"https://api-inference.huggingface.co/models/{HF_EMBEDDING_MODEL}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        payload = {"inputs": [resume_text[:2000], job_description[:2000]]}
        res = requests.post(url, headers=headers, json=payload, timeout=10)

        if res.ok:
            embeddings = res.json()
            if isinstance(embeddings, list) and len(embeddings) >= 2:
                vec_resume = embeddings[0]
                vec_jd = embeddings[1]
                
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
        print(f"[HuggingFace Embeddings ATS Exception]: {e}")

    return None

def hf_enhance_section(api_key, section_name, text_to_enhance, job_description=""):
    """
    Enhances resume section text using Hugging Face Llama 3 / Mistral model.
    """
    prompt = f"You are an expert ATS resume writer. Enhance the following resume {section_name} to be impactful, quantifiable, and optimized for key job requirements.\n\nOriginal Text: {text_to_enhance}\n\nJob Description: {job_description}\n\nProvide 3 distinct enhanced bullet points. Format output clearly."
    enhanced_output = generate_with_huggingface(api_key, prompt)

    bullets = [re.sub(r'^[-•*]\s*', '', b.strip()) for b in enhanced_output.split("\n") if b.strip()]
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
