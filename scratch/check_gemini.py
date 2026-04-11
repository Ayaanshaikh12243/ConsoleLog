import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
from dotenv import load_dotenv
from google import genai
import pathlib

# Load .env
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {api_key[:10]}...")

client = genai.Client(api_key=api_key)

try:
    print("Testing Gemini Flash Latest text generation...")
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents="Say hello in one word."
    )
    print(f"Response: {response.text}")
    print("SUCCESS: Gemini connection established.")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"FAILURE: {e}")
