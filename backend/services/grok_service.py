"""
Groq LLM Service — Uses Groq's OpenAI-compatible API
Supports llama-3.3-70b-versatile and other Groq-hosted models.
API key is loaded from .env (XAI_API_KEY) and never logged.
"""

import os
import json
import urllib.request
import urllib.error
from pathlib import Path

# Load .env file manually (no external deps)
def _load_env():
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and value and key not in os.environ:
                        os.environ[key] = value

_load_env()

GROQ_API_KEY = os.environ.get("XAI_API_KEY", "")
GROQ_MODEL   = os.environ.get("XAI_MODEL", "llama-3.3-70b-versatile")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def query_grok(messages: list, max_tokens: int = 1024) -> str | None:
    """
    Send messages to Groq API and return the assistant reply text.
    Returns None if the API key is missing or the call fails.
    """
    if not GROQ_API_KEY:
        print("Groq API: XAI_API_KEY is not set. Falling back to local RAG formatter.")
        return None

    candidate_models = [GROQ_MODEL, "llama-3.1-8b-instant", "llama-3.3-70b-versatile"]
    
    for model_name in candidate_models:
        payload = {
            "model": model_name,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.3,
        }

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                GROQ_API_URL,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "User-Agent": "python-urllib/3.12",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result["choices"][0]["message"]["content"]

        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            if "model_not_found" in body or e.code == 404:
                continue
            print(f"Groq API HTTP {e.code}: {body[:300]}")
            return None
        except Exception as exc:
            print(f"Groq API error: {exc}")
            return None

    return None
