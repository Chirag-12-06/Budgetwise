from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime, timezone
import base64
import cv2
import numpy as np
from services.image_pipeline import image_pipeline 

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
])  # Enable CORS for frontend

SERVICE_STARTED_AT = datetime.now(timezone.utc)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint for the OCR service."""
    return jsonify({
        'status': 'healthy',
        'service': 'ocr-service',
        'started_at': SERVICE_STARTED_AT.isoformat()
    }), 200


@app.route('/', methods=['GET', 'HEAD'])
def root_health():
    """Root endpoint for deployment platform health checks."""
    return health()


@app.route('/api/process-receipt', methods=['POST'])
def process_receipt():
    try:
        data = request.json or {}
        image_b64 = data.get('image_b64')

        if not image_b64:
            return jsonify({'error': 'image_b64 is required'}), 400

        # Remove data URI prefix if present
        if image_b64.startswith('data:'):
            image_b64 = image_b64.split(',', 1)[1]

        try:
            binary = base64.b64decode(image_b64)
        except Exception as e:
            return jsonify({'error': 'invalid base64 image', 'detail': str(e)}), 400

        image = cv2.imdecode(
            np.frombuffer(binary, np.uint8),
            cv2.IMREAD_COLOR
        )
        result=image_pipeline(image)

        return jsonify({
            'ok': True,
            'data': result,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('OCR_PORT') or os.getenv('PORT', '5002'))
    debug_enabled = os.getenv('FLASK_DEBUG', '0') == '1'

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_enabled
    )
