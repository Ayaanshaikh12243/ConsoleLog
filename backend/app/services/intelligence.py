import httpx
import json
import os
import google.generativeai as genai

FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "rc_b61bb884ceb020f86afed2793f0b404614f993d83b786bd27a5af6cc42c2ba87")
FEATHERLESS_ENDPOINT = "https://api.featherless.ai/v1/chat/completions"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini as fallback
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class IntelligenceService:
    @staticmethod
    async def get_ai_explanation(alert_type: str, data: dict):
        """Pure explanation engine restricted to the detected hazard."""
        if alert_type == "NORMAL":
            return "Metropolitan infrastructure sectors report stable environmental equilibrium."

        # Filter data to only show what matters for the type
        context = f"Type: {alert_type}. "
        if alert_type == "FLOOD": context += f"Rainfall: {data.get('rainfall')}mm, Soil: {data.get('soil')*100}% saturation."
        if alert_type == "DROUGHT": context += f"Rainfall: {data.get('rainfall')}mm, NDVI: {data.get('ndvi')}."
        if alert_type == "CYCLONE": context += f"Wind: {data.get('wind')}km/h, Rainfall: {data.get('rainfall')}mm."
        if alert_type == "EARTHQUAKE": context += f"Seismic: Mag {data.get('seismic')}."
        if alert_type == "VEGETATION_STRESS": context += f"NDVI: {data.get('ndvi')}, Rainfall: {data.get('rainfall')}mm."

        prompt = (
            f"STRATUM REPORT: {context} "
            f"Explain WHY {alert_type} is a risk using the data. "
            f"Format: 'Hazard identified due to [Data]. Immediate risk: [Danger].' "
            f"STRICT RULE: Respond ONLY in English. Use 15 words maximum."
        )

        # Try Gemini first (more reliable)
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                return response.text.strip()
            except Exception as e:
                print(f"Gemini Error: {e}")

        # Fallback to Featherless
        headers = {
            "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "Qwen/Qwen2.5-32B-Instruct",
            "messages": [
                {"role": "system", "content": "You are a disaster response AI. Be technical, brief, and English-only. No preamble."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(FEATHERLESS_ENDPOINT, headers=headers, json=payload, timeout=20.0)
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"].strip()
            except httpx.HTTPStatusError as e:
                print(f"Featherless API Error {e.response.status_code}: {e.response.text}")
            except Exception as e:
                print(f"Explanation Error: {e}")
        
        return f"Sector anomaly detected via {alert_type} heuristic baseline. CORTEX maintains passive surveillance."

    @staticmethod
    async def analyze_field_upload(filename: str, content_preview: str):
        """Analyzes field intelligence uploads."""
        prompt = f"Analyze field data: {content_preview}. Alert type: {filename}. Give a 1-sentence technical risk brief."
        
        # Try Gemini first
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                return response.text.strip()
            except Exception as e:
                print(f"Gemini Error: {e}")
        
        # Fallback to Featherless
        headers = {
            "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "Qwen/Qwen2.5-32B-Instruct",
            "messages": [
                {"role": "system", "content": "You are STRATUM CORTEX. 1-sentence analysis."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }

        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(FEATHERLESS_ENDPOINT, headers=headers, json=payload, timeout=20.0)
                res.raise_for_status()
                return res.json()['choices'][0]['message']['content'].strip()
            except httpx.HTTPStatusError as e:
                print(f"Featherless API Error {e.response.status_code}: {e.response.text}")
            except Exception as e:
                print(f"Upload Analysis Error: {e}")
        
        return "Field report processed. Metrics ingested into regional baseline."
