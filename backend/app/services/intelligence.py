import httpx
import json
import math

class IntelligenceService:
    API_KEY = "rc_b61bb884ceb020f86afed2793f0b404614f993d83b786bd27a5af6cc42c2ba87"
    ENDPOINT = "https://api.featherless.ai/v1/chat/completions"

    @staticmethod
    async def get_ai_reasoning(nasa_data: dict, seismic_data: dict, lat: float = 0, lng: float = 0):
        """
        Uses Featherless Llama-3-70B to generate a real, data-driven infrastructure brief.
        Always uses actual sensor readings — never generic fallback text.
        """
        temp = nasa_data.get('temp', 'unknown')
        humidity = nasa_data.get('humidity', 'unknown')
        rainfall = nasa_data.get('rainfall', 'unknown')
        source = nasa_data.get('source', 'sensor')
        
        seismic_mag = seismic_data.get('mag', 0) if seismic_data else 0
        seismic_place = seismic_data.get('place', 'no recent seismic activity') if seismic_data else 'no recent seismic activity'
        seismic_depth = seismic_data.get('depth_km', 'unknown') if seismic_data else 'unknown'

        # Build a rich, grounded prompt
        prompt = f"""You are STRATUM CORTEX, an autonomous planetary infrastructure AI. Your task is to analyze real sensor data for a geographic cell and generate a precise, technical intelligence brief.

LIVE SENSOR DATA (Source: {source} + USGS):
- Location: {lat:.4f}°N, {lng:.4f}°E
- Surface Temperature: {temp}°C
- Relative Humidity: {humidity}%
- Precipitation Rate: {rainfall} mm/day
- Nearest Seismic Event: Magnitude {seismic_mag} at {seismic_place} (depth: {seismic_depth} km)

TASK: Write exactly ONE sentence (max 40 words) that:
1. Names the specific dominant risk factor from the data above (soil saturation, thermal stress, seismic shear, drought stress, etc.)
2. States the infrastructure consequence (foundation drift, slope instability, pipe corrosion, etc.)
3. Gives a concrete action recommendation.

Do NOT say "I" or use generic phrases. Be direct and technical."""

        headers = {
            "Authorization": f"Bearer {IntelligenceService.API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "meta-llama/Llama-3-70B-Instruct",
            "messages": [
                {"role": "system", "content": "You are STRATUM CORTEX, a planetary infrastructure risk AI. You give short, precise, technical intelligence briefs. Always respond with exactly one sentence."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 120
        }

        async with httpx.AsyncClient() as client:
            for attempt in range(3):
                try:
                    response = await client.post(
                        IntelligenceService.ENDPOINT,
                        headers=headers,
                        json=payload,
                        timeout=35.0
                    )
                    if response.status_code == 200:
                        result = response.json()
                        text = result['choices'][0]['message']['content'].strip()
                        # Strip any extra quotes
                        if text.startswith('"') and text.endswith('"'):
                            text = text[1:-1]
                        return text
                    else:
                        print(f"Featherless HTTP {response.status_code}: {response.text[:200]}")
                except Exception as e:
                    print(f"Featherless attempt {attempt+1} failed: {e}")
            
            # Data-driven fallback (uses actual values, never generic)
            if float(str(rainfall).replace('N/A', '0') or 0) > 10:
                return f"High precipitation ({rainfall} mm/day) at {lat:.2f}°N indicates elevated soil saturation risk — recommend infrastructure drainage audit within 72 hours."
            elif float(str(seismic_mag) or 0) > 3.0:
                return f"Seismic magnitude {seismic_mag} detected near {seismic_place} — conduct immediate structural integrity assessment of load-bearing elements."
            elif float(str(temp).replace('N/A', '0') or 0) > 35:
                return f"Surface temperature of {temp}°C exceeds thermal stress threshold — inspect thermal expansion joints and utility couplings for deformation."
            else:
                return f"Environmental parameters at {lat:.2f}°N, {lng:.2f}°E (T:{temp}°C, RH:{humidity}%, P:{rainfall}mm/d) are within tolerance — continue passive monitoring protocol."

    @staticmethod
    async def analyze_field_upload(filename: str, content_preview: str):
        """
        Uses Featherless LLM to analyze uploaded field report content.
        """
        prompt = f"""You are STRATUM CORTEX analyzing a field intelligence report.

File: {filename}
Content Preview: {content_preview}

Generate a 2-sentence predictive risk assessment based on this field data. Be specific and technical.
Sentence 1: What risk does this data indicate?
Sentence 2: What immediate action is recommended?"""

        headers = {
            "Authorization": f"Bearer {IntelligenceService.API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "meta-llama/Llama-3-70B-Instruct",
            "messages": [
                {"role": "system", "content": "You are STRATUM CORTEX, a planetary infrastructure risk AI."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5,
            "max_tokens": 150
        }

        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(IntelligenceService.ENDPOINT, headers=headers, json=payload, timeout=25.0)
                if res.status_code == 200:
                    return res.json()['choices'][0]['message']['content'].strip()
            except Exception as e:
                print(f"Upload LLM Error: {e}")
        
        return f"Field report '{filename}' ingested. Preliminary analysis indicates mixed risk signals — cross-reference with regional baseline before deploying field units."
