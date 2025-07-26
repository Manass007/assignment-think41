import requests
import os

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

def query_llm(messages):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",  # Updated to current model
        "messages": messages,
        "max_tokens": 512,
        "temperature": 0.7
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
        
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error occurred: {e}")
        print(f"Response content: {response.text}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise

    # response = requests.post(url, headers=headers, json=data)
    # response.raise_for_status()
    # return response.json()["choices"][0]["message"]["content"]