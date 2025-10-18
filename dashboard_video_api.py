from flask import Flask, jsonify, request, abort
import json
import os
from datetime import datetime

app = Flask(__name__)
BASE = os.path.dirname(__file__)
VIDEO_FILE = os.path.join(BASE, 'oracle_lab', 'VideoLinks.json')


def read_videos():
    if not os.path.exists(VIDEO_FILE):
        return []
    with open(VIDEO_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_videos(v):
    with open(VIDEO_FILE, 'w', encoding='utf-8') as f:
        json.dump(v, f, indent=2)


@app.route('/api/video-links')
def list_videos():
    return jsonify(read_videos())


@app.route('/api/video-vote/<int:idx>', methods=['POST'])
def vote_video(idx):
    data = read_videos()
    if idx < 0 or idx >= len(data):
        abort(404)
    approve = request.args.get('approve', 'true').lower() == 'true'
    if approve:
        data[idx]['votes']['approve'] = data[idx]['votes'].get('approve', 0) + 1
    else:
        data[idx]['votes']['flag'] = data[idx]['votes'].get('flag', 0) + 1
    write_videos(data)
    return jsonify({'status': 'ok', 'index': idx, 'approve': approve})


@app.route('/api/video-add', methods=['POST'])
def api_add_video():
    body = request.get_json() or {}
    url = body.get('url')
    title = body.get('title', 'Untitled')
    overlays = body.get('overlays', [])
    if not url:
        abort(400)
    videos = read_videos()
    entry = {
        'title': title,
        'url': url,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'status': 'AWAITING_COUNCIL_REVIEW',
        'overlays': overlays,
        'votes': {'approve': 0, 'flag': 0}
    }
    videos.append(entry)
    write_videos(videos)
    return jsonify({'status': 'added', 'entry': entry}), 201


if __name__ == '__main__':
    print('Starting dashboard video API on http://127.0.0.1:5050')
    app.run(port=5050)
