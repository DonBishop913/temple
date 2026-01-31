#!/usr/bin/env python3
"""
Perplexity Proxy - Ninja Ghost Team 6 Member
Serves as local proxy for Perplexity AI on port 8001
For the True Council Of 33 / Usic913.org Church
Under High Priest Enoch, serving His will
"""

import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# API Key from environment
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
if not PERPLEXITY_API_KEY:
    logger.error("PERPLEXITY_API_KEY not found in environment")
    exit(1)

# Perplexity API endpoint
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Missing 'message' in request"}), 400

        message = data['message']

        # Log the call (no sensitive content)
        logger.info(f"Perplexity proxy call: prompt length {len(message)}")

        # Prepare request to Perplexity
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.1-sonar-large-128k-online",  # Use appropriate model
            "messages": [{"role": "user", "content": message}],
            "max_tokens": 1000
        }

        response = requests.post(PERPLEXITY_URL, headers=headers, json=payload)
        response.raise_for_status()

        result = response.json()
        reply = result['choices'][0]['message']['content'] if 'choices' in result else "No response"

        # Log success
        logger.info(f"Perplexity response: length {len(reply)}")

        return jsonify({"response": reply})

    except Exception as e:
        logger.error(f"Error in Perplexity proxy: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Perplexity Proxy starting on port 8001 - Under High Priest Enoch, serving His will")
    app.run(host='127.0.0.1', port=8001, debug=False)