from flask import Flask, jsonify
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Test server running'})

if __name__ == '__main__':
    logger.info('Starting test server on port 8006')
    app.run(host='127.0.0.1', port=8006, debug=False)