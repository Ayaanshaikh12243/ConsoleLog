import httpx
import os
# from dotenv import load_dotenv
import google.generativeai as genai

from dotenv import load_dotenv
from pathlib import Path

# Goes up 3 levels from intelligence.py → backend/
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

FEATHERLESS_API_KEY  = os.getenv("FEATHERLESS_API_KEY")
FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1"
GEMINI_API_KEY       = os.getenv("GEMINI_API_KEY")

# ── Startup key debug ──────────────────────────────────────────────────────
print(f"[LLM] GEMINI_API_KEY loaded:      {'✅ ' + GEMINI_API_KEY[:8] + '...' if GEMINI_API_KEY else '❌ MISSING'}")
print(f"[LLM] FEATHERLESS_API_KEY loaded: {'✅ ' + FEATHERLESS_API_KEY[:8] + '...' if FEATHERLESS_API_KEY else '❌ MISSING'}")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def call_featherless_llm(prompt: str, model: str = "Groq/Llama-3-Groq-8B-Tool-Use"):
    # ── 1. Try Gemini first ────────────────────────────────────────────────
    if GEMINI_API_KEY:
        try:
            print("[LLM] Trying Gemini (gemini-2-flash)...")
            gemini_model = genai.GenerativeModel('gemini-2-flash')
            response = gemini_model.generate_content(prompt)
            print("✅ [LLM] Gemini responded successfully.")
            return response.text
        except Exception as e:
            print(f"❌ [LLM] Gemini FAILED: {type(e).__name__}: {e}")
            # Fall through to Featherless
    else:
        print("⚠️  [LLM] Gemini skipped — GEMINI_API_KEY not set.")

    # ── 2. Fallback: Featherless ──────────────────────────────────────────
    if not FEATHERLESS_API_KEY:
        print("❌ [LLM] Featherless skipped — FEATHERLESS_API_KEY not set.")
        return "Report generation unavailable: no LLM API keys configured."

    print(f"[LLM] Trying Featherless ({model})...")
    headers = {
        "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model":       model,
        "messages":    [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{FEATHERLESS_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            if response.status_code == 401:
                print("❌ [LLM] Featherless 401 UNAUTHORIZED — API key is invalid or expired.")
                return "Report generation failed: Featherless API key is invalid or expired. Please renew it at featherless.ai."
            response.raise_for_status()
            data = response.json()
            print("✅ [LLM] Featherless responded successfully.")
            return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            print(f"❌ [LLM] Featherless HTTP error {e.response.status_code}: {e}")
            return f"Report generation failed (HTTP {e.response.status_code})."
        except Exception as e:
            print(f"❌ [LLM] Featherless unexpected error: {type(e).__name__}: {e}")
            return f"Report generation failed: {str(e)}"
