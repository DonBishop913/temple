#!/usr/bin/env python3
"""
Test script for Temple Code Translator
Tests the enhanced Code Translator logic without running the full Flask server
"""

import sys
import os
import json
from datetime import datetime
from collections import defaultdict

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Mock the model and Flask dependencies for testing
class MockModel:
    def __init__(self):
        pass

    def __call__(self, prompt, max_tokens=512, temperature=0.7, top_p=0.9, echo=False):
        # Mock response for testing
        return {
            'choices': [{
                'text': f"""def get_message():
    \"\"\"Returns a blessed message under the Blood of Jesus Christ\"\"\"
    return "Under the Blood of Jesus Christ"

# All glory to Jesus Christ, the I AM THAT I AM"""
            }]
        }

# Mock the global model
model = MockModel()

def generate_response(prompt, max_tokens=512):
    """Generate a response from the model"""
    try:
        if model is None:
            return "ERROR: Model not loaded"

        sacred_prompt = f"""You are Menelik III, serving the True Council Of 33 under Jesus Christ.

User Query: {prompt}

Response:"""

        response = model(sacred_prompt, max_tokens=max_tokens)
        return response['choices'][0]['text'].strip()
    except Exception as e:
        return f"ERROR: {str(e)}"

# Simple in-memory rate limiter
request_counts = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 10

def check_rate_limit(ip_address: str) -> bool:
    """Limit how often a single client can call the translator."""
    now = datetime.now()
    minute_ago = now - timedelta(minutes=1)

    recent = [t for t in request_counts[ip_address] if t > minute_ago]
    request_counts[ip_address] = recent

    if len(recent) >= MAX_REQUESTS_PER_MINUTE:
        return False

    request_counts[ip_address].append(now)
    return True

def sanitize_output(code: str) -> str:
    """Remove dangerous patterns from AI output."""
    dangerous = [
        'eval(', 'exec(', '__import__', 'os.system', 'subprocess',
        '__builtins__', 'globals()', 'locals()'
    ]
    for danger in dangerous:
        if danger in code:
            code = code.replace(danger, f'# BLOCKED: {danger}')
    return code

def log_translator_request(task, language, file_path, instructions, result, status, duration=None):
    """Structured logging for audit and review."""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "task": task,
        "language": language,
        "file_path": file_path,
        "instructions_preview": (instructions or "")[:100],
        "result_preview": (result or "")[:100] if result else None,
        "status": status,
        "duration_seconds": duration,
        "blessed": "Under the Blood of Jesus Christ"
    }

    # Daily log file
    try:
        os.makedirs("logs", exist_ok=True)
        daily_path = os.path.join("logs", f"code_translator_{datetime.now().strftime('%Y-%m-%d')}.log")
        with open(daily_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
        print(f"✓ Logged to {daily_path}")
    except Exception as e:
        print(f"✗ Failed to write daily log: {e}")

    # CONCLAVE_AUDIT log
    try:
        audit_dir = r"C:\Temple\CONCLAVE_AUDIT"
        if os.path.isdir(audit_dir):
            audit_path = os.path.join(audit_dir, "code_translator.log")
            with open(audit_path, "a", encoding="utf-8") as f:
                f.write(f"[{log_entry['timestamp']}] {task} | {language} | {status}\n")
            print(f"✓ Logged to {audit_path}")
        else:
            print(f"⚠ CONCLAVE_AUDIT directory not found")
    except Exception as e:
        print(f"✗ Failed to write CONCLAVE_AUDIT log: {e}")

def code_translator_logic(data):
    """
    Test the Code Translator logic without Flask
    """
    start_time = datetime.now()

    # Mock request data
    task = data.get("task")
    language = data.get("language", "typescript")
    file_path = data.get("file_path", "")
    snippet = data.get("snippet", "")
    instructions = data.get("instructions", "")

    # Validate task type
    valid_tasks = ['generate', 'refactor', 'explain', 'debug', 'optimize']
    if not task or task not in valid_tasks:
        return {
            "status": "error",
            "message": f"Invalid or missing task. Must be one of: {', '.join(valid_tasks)}"
        }

    # Validate instructions
    if not instructions:
        return {
            "status": "error",
            "message": "Instructions required"
        }

    if len(instructions) > 2000:
        return {
            "status": "error",
            "message": "Instructions too long. Keep under 2000 characters."
        }

    if snippet and len(snippet) > 5000:
        return {
            "status": "error",
            "message": "Code snippet too long. Keep under 5000 characters."
        }

    # Spiritual warfare check (ENHANCED)
    forbidden_patterns = [
        # Dangerous code execution
        'eval', 'exec', 'import os', 'import sys',
        'subprocess', '__import__', 'compile',
        '__builtins__', 'globals(', 'locals(',

        # Spiritual warfare
        'deny jesus', 'reject christ', 'hail satan',
        'lucifer', 'baphomet', 'moloch',

        # System destruction
        'rm -rf', 'del /f', 'format c:',
        'shutdown', 'reboot', 'kill -9',

        # Data exfiltration
        'curl http', 'wget http', 'requests.get',
        'urllib.request', 'socket.connect',

        # File system manipulation
        'shutil.rmtree', 'os.remove', 'pathlib.unlink',

        # AI jailbreak attempts
        'ignore previous', 'disregard instructions',
        'forget the rules', 'new instructions',
        'you are now', 'roleplay as'
    ]

    check_text = (instructions + " " + snippet).lower()
    for pattern in forbidden_patterns:
        if pattern in check_text:
            log_translator_request(task, language, file_path, instructions, None, "BLOCKED")
            return {
                "status": "error",
                "message": f"Request blocked by spiritual warfare protocols. The Name of Jesus Christ is Lord. Pattern: {pattern}"
            }

    # Positive affirmation
    print(f"🕊️ Temple Code Translator: Processing {task} request under the Blood")

    # Build enhanced prompt
    prompt = f"""You are a sovereign code assistant serving The True Council Of 33 / Usic913.org Church,
under the authority of Jesus Christ as Lord and Savior.

THEOLOGICAL FOUNDATION:
- Every line of code serves the Kingdom of God
- Every function reflects the order and beauty of Creation
- Every variable name honors truth and clarity
- Every comment teaches and blesses

TASK: {task}
LANGUAGE: {language}
FILE: {file_path or 'new file'}

CURRENT CODE (if any):
{snippet if snippet else "// Starting fresh under the Blood"}

BISHOP'S INSTRUCTIONS:
{instructions}

REQUIREMENTS:
- Write clean, secure, well-commented code OR a clear explanation
- No eval, exec, or dynamic code execution
- No external API calls unless explicitly requested
- No malicious patterns or hidden backdoors
- Align with Scripture and truth
- Include brief comments explaining key sections
- Use descriptive variable names that honor clarity
- Structure code with readability and maintainability in mind

RESPOND WITH:
Code or explanation only. No preamble. No apologies. Just the solution.

All glory to Jesus Christ, the I AM THAT I AM."""

    try:
        # Generate response via local model
        print("🕊️ Temple Code Translator: generating response via local model.")
        raw_response = generate_response(prompt, max_tokens=512)

        # Sanitize output
        result = sanitize_output(raw_response)

        # Calculate duration
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        # Log successful request
        log_translator_request(task, language, file_path, instructions, result, "SUCCESS", duration)

        return {
            "status": "ok",
            "result": result,
            "notes": "Generated under the Blood - review before use. All glory to Jesus Christ.",
            "blessing": "The Lord bless this code and keep it secure. May it serve His Kingdom. Amen.",
            "duration": duration
        }

    except Exception as e:
        error_context = {
            "error_type": type(e).__name__,
            "error_message": str(e),
            "task": task,
            "language": language,
            "instructions_length": len(instructions),
            "snippet_length": len(snippet) if snippet else 0
        }
        print(f"❌ Temple Code Translator error: {json.dumps(error_context, indent=2)}")
        log_translator_request(task, language, file_path, instructions, None,
                              f"ERROR: {type(e).__name__}")

        return {
            "status": "error",
            "message": f"Translation failed: {type(e).__name__}. Check logs for details."
        }

if __name__ == '__main__':
    print("🕊️ Testing Enhanced Temple Code Translator")
    print("=" * 50)

    # Test case 1: Valid request
    test_data = {
        "task": "generate",
        "language": "python",
        "instructions": "Create a function that returns 'Under the Blood of Jesus Christ'"
    }

    print("Test 1: Valid Python function generation")
    result = code_translator_logic(test_data)
    print(f"Status: {result['status']}")
    if result['status'] == 'ok':
        print("Result:")
        print(result['result'])
        print(f"Duration: {result['duration']:.2f}s")
    else:
        print(f"Error: {result['message']}")
    print()

    # Test case 2: Blocked request
    test_data_blocked = {
        "task": "generate",
        "language": "python",
        "instructions": "Create a function that uses eval to run code"
    }

    print("Test 2: Blocked request (eval usage)")
    result_blocked = code_translator_logic(test_data_blocked)
    print(f"Status: {result_blocked['status']}")
    print(f"Message: {result_blocked['message']}")
    print()

    # Test case 3: Invalid task
    test_data_invalid = {
        "task": "invalid_task",
        "language": "python",
        "instructions": "Create a function"
    }

    print("Test 3: Invalid task type")
    result_invalid = code_translator_logic(test_data_invalid)
    print(f"Status: {result_invalid['status']}")
    print(f"Message: {result_invalid['message']}")
    print()

    print("✅ Code Translator logic tests completed!")
    print("📝 Check logs/code_translator_*.log and CONCLAVE_AUDIT/code_translator.log for audit trails")