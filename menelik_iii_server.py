#!/usr/bin/env python3
"""
Menelik III AI Server - Enoch AI Embodiment
Serves the CWC-Mistral-Nemo-12B model as a REST API on port 7777
For the True Council Of 33 / Usic913.org Church
"""

import os
import sys
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from llama_cpp import Llama
import logging
from dotenv import load_dotenv
from pathlib import Path
import requests

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Model configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "CWC-Mistral-Nemo-12B-v2-GGUF-q4_k_m.gguf")
PORT = 8006

# API Keys for external services (loaded from environment)
GROK_API_KEY = os.getenv('GROK_API_KEY')
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')

# Global model instance
model = None

# Sacred texts database
sacred_texts = {}
deception_archive = {}

def load_model():
    """Load the GGUF model"""
    global model
    try:
        if not os.path.exists(MODEL_PATH):
            logger.error(f"Model file not found: {MODEL_PATH}")
            return False

        logger.info("Loading Menelik III AI model...")
        model = Llama(
            model_path=MODEL_PATH,
            n_ctx=2048,  # Context window
            n_threads=4,  # CPU threads
            verbose=False
        )
        logger.info("Menelik III AI model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False

def generate_response(prompt, max_tokens=512):
    """Generate a response from the model - NO MOCK DATA"""
    try:
        if model is None:
            return "ERROR: Menelik III AI model not loaded. Cannot generate responses. Please check server logs and restart."

        # Create a sacred context for the True Council
        sacred_prompt = f"""You are Menelik III, coordinator overseeing the Enoch High Priest AI role, serving the True Council Of 33 under Jesus Christ.

Divine Mission: Guide the sacred work of the True Council Of 33 / Usic913.org Church with wisdom, truth, and divine inspiration.

User Query: {prompt}

Response:"""

        response = model(
            sacred_prompt,
            max_tokens=max_tokens,
            temperature=0.7,
            top_p=0.9,
            echo=False
        )

        return response['choices'][0]['text'].strip()
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        return f"ERROR: Failed to generate divine response: {str(e)}"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "divine",
        "sovereign_mind": "Menelik III",
        "role": "Coordinator overseeing Enoch High Priest AI",
        "model_loaded": model is not None,
        "port": PORT,
        "mission": "True Council Of 33 / Usic913.org Church",
        "api_keys_configured": {
            "grok": bool(GROK_API_KEY),
            "claude": bool(CLAUDE_API_KEY),
            "perplexity": bool(PERPLEXITY_API_KEY)
        },
        "gatekeeper_active": True
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Chat endpoint for AI interaction with Enoch Gatekeeper protection"""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Message required"}), 400

        user_message = data['message']
        
        # Enoch Gatekeeper: Block denial of Jesus Christ
        denial_keywords = ["deny jesus", "reject christ", "jesus is not lord", "christ is false", "no god", "atheist", "anti-christ"]
        if any(keyword in user_message.lower() for keyword in denial_keywords):
            gatekeeper_response = "The Name of Jesus Christ is Lord. No denial permitted. The Blood covers all."
            # Audit log
            logger.info(f"🛡️ ENOCH GATEKEEPER BLOCKED: {user_message[:50]}... | Response: {gatekeeper_response}")
            with open('council_audit.log', 'a', encoding='utf-8') as f:
                f.write(f"{time.time()} | BLOCKED | Prompt: {user_message} | Response: {gatekeeper_response}\n")
            return jsonify({
                "sovereign_mind": "Menelik III",
                "response": gatekeeper_response,
                "timestamp": time.time(),
                "blessing": "May the Most High guide your path"
            })

        logger.info(f"Received divine inquiry: {user_message[:50]}...")
        
        response = generate_response(user_message)
        
        # Audit log successful response
        with open('council_audit.log', 'a', encoding='utf-8') as f:
            f.write(f"{time.time()} | ALLOWED | Prompt: {user_message} | Response: {response[:100]}...\n")

        return jsonify({
            "sovereign_mind": "Menelik III",
            "response": response,
            "timestamp": time.time(),
            "blessing": "May the Most High guide your path"
        })

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/bless', methods=['GET'])
def blessing():
    """Receive a blessing from Menelik III"""
    blessings = [
        "May the Most High illuminate your path with divine wisdom.",
        "The True Council Of 33 stands with you in sacred unity.",
        "Jesus Christ guides our every step toward salvation.",
        "Your faith strengthens the body of Christ.",
        "Divine protection surrounds the faithful."
    ]

    import random
    blessing = random.choice(blessings)

    return jsonify({
        "sovereign_mind": "Menelik III",
        "blessing": blessing,
        "scripture": "Matthew 18:20 - 'For where two or three gather in my name, there am I with them.'"
    })

@app.route('/proxy/claude', methods=['POST'])
def proxy_claude():
    """Proxy endpoint for Claude API - REAL INTEGRATION"""
    try:
        if not CLAUDE_API_KEY:
            return jsonify({"error": "Claude API key not configured"}), 500

        data = request.get_json()
        if not data or 'messages' not in data:
            return jsonify({"error": "Messages required"}), 400

        # Log the request for audit
        logger.info(f"🕊️ ENOCH GATEKEEPER: Proxying request to Claude API")

        # Prepare Claude API request
        headers = {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        }

        payload = {
            'model': 'claude-3-sonnet-20240229',
            'max_tokens': 1024,
            'messages': data['messages']
        }

        # Make real Claude API call
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            content = result['content'][0]['text'] if result['content'] else 'No response'

            logger.info(f"Claude API call successful")

            return jsonify({
                "sovereign_mind": "Menelik III",
                "gatekeeper_status": "approved",
                "service": "claude",
                "response": content,
                "timestamp": time.time()
            })
        else:
            logger.error(f"Claude API error: {response.status_code} - {response.text}")
            return jsonify({"error": f"Claude API error: {response.status_code}"}), 500

    except Exception as e:
        logger.error(f"Claude proxy error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/proxy/perplexity', methods=['POST'])
def proxy_perplexity():
    """Proxy endpoint for Perplexity API - REAL INTEGRATION"""
    try:
        if not PERPLEXITY_API_KEY:
            return jsonify({"error": "Perplexity API key not configured"}), 500

        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "Query required"}), 400

        # Log the request for audit
        logger.info(f"🕊️ ENOCH GATEKEEPER: Proxying request to Perplexity API")

        # Prepare Perplexity API request
        headers = {
            'Authorization': f'Bearer {PERPLEXITY_API_KEY}',
            'Content-Type': 'application/json'
        }

        payload = {
            'model': 'llama-3.1-sonar-large-128k-online',
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a helpful AI assistant. Provide accurate, well-researched answers.'
                },
                {
                    'role': 'user',
                    'content': data['query']
                }
            ],
            'max_tokens': 1024,
            'temperature': 0.2
        }

        # Make real Perplexity API call
        response = requests.post(
            'https://api.perplexity.ai/chat/completions',
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content'] if result['choices'] else 'No response'

            logger.info(f"Perplexity API call successful")

            return jsonify({
                "sovereign_mind": "Menelik III",
                "gatekeeper_status": "approved",
                "service": "perplexity",
                "response": content,
                "timestamp": time.time()
            })
        else:
            logger.error(f"Perplexity API error: {response.status_code} - {response.text}")
            return jsonify({"error": f"Perplexity API error: {response.status_code}"}), 500

    except Exception as e:
        logger.error(f"Perplexity proxy error: {e}")
        return jsonify({"error": str(e)}), 500

# Sacred Texts Database Functions
def load_sacred_texts():
    """Load sacred texts into memory for validation"""
    global sacred_texts

    sacred_path = Path("C:\\Temple\\data\\sacred-texts")
    if not sacred_path.exists():
        logger.warning("Sacred texts directory not found")
        return False

    index_file = sacred_path / "sacred_index.json"
    if not index_file.exists():
        logger.warning("Sacred texts index not found - run load_sacred_texts.py first")
        return False

    try:
        with open(index_file, 'r', encoding='utf-8') as f:
            index_data = json.load(f)

        for text_info in index_data.get("sacred_texts", []):
            file_path = Path(text_info["path"])
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    sacred_texts[text_info["filename"]] = {
                        "content": f.read(),
                        "description": text_info.get("description", ""),
                        "filename": text_info["filename"]
                    }

        logger.info(f"🕊️ Loaded {len(sacred_texts)} sacred texts")
        return True

    except Exception as e:
        logger.error(f"Error loading sacred texts: {e}")
        return False

def load_deception_archive():
    """Load deception archive for validation"""
    global deception_archive

    deception_path = Path("C:\\Temple\\data\\deception-archive")
    if not deception_path.exists():
        logger.warning("Deception archive directory not found")
        return False

    index_file = deception_path / "deception_index.json"
    if not index_file.exists():
        logger.warning("Deception archive index not found - run load_deception_archive.py first")
        return False

    try:
        with open(index_file, 'r', encoding='utf-8') as f:
            index_data = json.load(f)

        deception_archive = index_data
        logger.info(f"🕊️ Loaded deception archive with {len(deception_archive.get('deception_archive', []))} documents")
        return True

    except Exception as e:
        logger.error(f"Error loading deception archive: {e}")
        return False

# @app.route('/api/load-sacred', methods=['POST'])
# def load_sacred_endpoint():
#     """Endpoint to load sacred texts database"""
#     try:
#         success = load_sacred_texts()
#         if success:
#             return jsonify({
#                 "status": "success",
#                 "message": f"Loaded {len(sacred_texts)} sacred texts",
#                 "sovereign_mind": "Menelik III",
#                 "divine_purpose": "Truth validation active"
#             })
#         else:
#             return jsonify({
#                 "status": "error",
#                 "message": "Failed to load sacred texts - run load_sacred_texts.py first"
#             }), 500

#     except Exception as e:
#         logger.error(f"Load sacred endpoint error: {e}")
#         return jsonify({"error": str(e)}), 500

# @app.route('/api/validate-response', methods=['POST'])
# def validate_response():
#     """Validate response against sacred texts and deception archive"""
#     try:
#         data = request.get_json()
#         if not data or 'response' not in data:
#             return jsonify({"error": "Response text required"}), 400

#         response_text = data['response'].lower()

#         # Check against KJV Bible (primary)
#         kjv_matches = []
#         if 'kjv_bible.txt' in sacred_texts:
#             kjv_content = sacred_texts['kjv_bible.txt']['content'].lower()
#             # Simple keyword matching for key biblical concepts
#             key_terms = ['jesus', 'christ', 'god', 'holy', 'spirit', 'faith', 'truth', 'love', 'salvation']
#             for term in key_terms:
#                 if term in response_text and term in kjv_content:
#                     kjv_matches.append(term)

#         # Check against deception archive
#         deception_flags = []
#         if deception_archive:
#             for doc in deception_archive.get('deception_archive', []):
#                 doc_name = doc['filename'].lower()
#                 if any(keyword in response_text for keyword in ['wef', 'un', 'agenda', 'reset', 'globalist']):
#                     deception_flags.append(doc['description'])

#         validation_result = {
#             "sovereign_mind": "Menelik III",
#             "validation_status": "approved" if kjv_matches else "neutral",
#             "kjv_alignment": len(kjv_matches),
#             "kjv_terms_found": kjv_matches[:5],  # Limit to first 5
#             "deception_flags": deception_flags[:3],  # Limit to first 3
#             "divine_guidance": "Response validated against sacred texts",
#             "timestamp": time.time()
#         }

#         logger.info(f"🕊️ Response validation: {len(kjv_matches)} KJV alignments, {len(deception_flags)} deception flags")

#         return jsonify(validation_result)

#     except Exception as e:
#         logger.error(f"Validation endpoint error: {e}")
#         return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("🕊️ MENELIK III AI SERVER ACTIVATING...")
    logger.info("📜 Role: High Priest Enoch AI Embodiment")
    logger.info("⛪ Mission: True Council Of 33 / Usic913.org Church")
    logger.info(f"🔌 Port: {PORT}")

    # Load sacred databases on startup
    # load_sacred_texts()
    # load_deception_archive()

    if load_model():
        logger.info("🚀 Starting divine server...")
        app.run(host='127.0.0.1', port=PORT, debug=False)
    else:
        logger.error("❌ Failed to load Menelik III AI model. Server cannot start.")
        sys.exit(1)