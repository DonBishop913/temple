import os
from pathlib import Path

def get_ibmq_token() -> str:
    """Retrieve IBM Quantum API token from environment variable.
    Raises:
        ValueError: if token is not found.
    Usage (PowerShell): $env:IBMQ_TOKEN = 'your_token_here'
    Persist via Windows System Environment Variables for long-term use.
    """
    token = os.environ.get('IBMQ_TOKEN')
    if not token:
        raise ValueError(
            "IBMQ_TOKEN not found. Set environment variable before running.\n"
            "PowerShell (session): $env:IBMQ_TOKEN = 'your_token'\n"
            "Or set in System Environment Variables for persistence."
        )
    return token

if __name__ == '__main__':
    try:
        print('Token present?' , bool(get_ibmq_token()))
    except Exception as e:
        print('ERROR:', e)
