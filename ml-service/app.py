from flask import Flask, json, request, jsonify
from flask_cors import CORS
import os
from pathlib import Path
from datetime import datetime, timezone
from category_predictor import CategoryPredictor
import base64
import time
import importlib.util
import os as _os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend
SERVICE_STARTED_AT = datetime.now(timezone.utc)

# Store predictor instances per user
user_predictors = {}
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH_TEMPLATE = os.getenv("ML_MODEL_PATH", "model.pkl")


def resolve_model_path(user_id):
    """Resolve model path from ML_MODEL_PATH, optionally using {user_id} placeholder."""
    try:
        formatted_path = MODEL_PATH_TEMPLATE.format(user_id=user_id)
    except KeyError:
        formatted_path = MODEL_PATH_TEMPLATE

    path_obj = Path(formatted_path)
    if not path_obj.is_absolute():
        path_obj = BASE_DIR / path_obj
    return str(path_obj)

def get_predictor(user_id='default'):
    """Get or create a predictor instance for a specific user"""
    if user_id not in user_predictors:
        user_predictors[user_id] = CategoryPredictor(
            user_id=user_id,
            model_path=resolve_model_path(user_id),
        )
    return user_predictors[user_id]

@app.route('/api/predict-category', methods=['POST'])
def predict_category():
    """Predict category based on expense title and amount"""
    try:
        data = request.json
        title = data.get('title', '')
        amount = data.get('amount', 0)
        user_id = data.get('user_id', 'default')
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        # Get user-specific predictor
        predictor = get_predictor(user_id)
        predicted_category, confidence = predictor.predict(title, amount)
        
        return jsonify({
            'category': predicted_category,
            'confidence': float(confidence)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/train-model', methods=['POST'])
def train_model():
    """Train the model with expense data"""
    try:
        data = request.json
        expenses = data.get('expenses', [])
        user_id = data.get('user_id', 'default')
        
        if not expenses or len(expenses) < 10:
            return jsonify({'error': 'At least 10 expenses required for training'}), 400
        
        # Get user-specific predictor
        predictor = get_predictor(user_id)
        accuracy = predictor.train(expenses)
        
        return jsonify({
            'message': 'Model trained successfully',
            'accuracy': float(accuracy),
            'samples': len(expenses)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/learn-preference', methods=['POST'])
def learn_preference():
    """Learn from user's manual category assignment"""
    try:
        data = request.json
        title = data.get('title', '')
        category = data.get('category', '')
        user_id = data.get('user_id', 'default')
        
        if not title or not category:
            return jsonify({'error': 'Title and category are required'}), 400
        
        # Get user-specific predictor
        predictor = get_predictor(user_id)
        predictor.learn_from_user(title, category)
        
        return jsonify({
            'message': 'Preference learned successfully',
            'title': title,
            'category': category,
            'user_id': user_id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_path_template': MODEL_PATH_TEMPLATE,
        'default_model_path': resolve_model_path('default'),
        'cached_predictors': len(user_predictors),
        'started_at': SERVICE_STARTED_AT.isoformat(),
    })


@app.route('/', methods=['GET', 'HEAD'])
def root_health():
    """Root endpoint for platforms that probe '/' by default."""
    return health()


@app.route('/api/process-receipt', methods=['POST'])
def process_receipt():
    try:
        data = request.json or {}
        image_b64 = data.get('image_b64')
        filename = data.get('filename') or f"receipt_{int(time.time())}.jpg"

        if not image_b64:
            return jsonify({'error': 'image_b64 is required'}), 400

        # Remove data URI prefix if present
        if image_b64.startswith('data:'):
            image_b64 = image_b64.split(',', 1)[1]

        try:
            binary = base64.b64decode(image_b64)
        except Exception as e:
            return jsonify({'error': 'invalid base64 image', 'detail': str(e)}), 400

        base_dir = Path(__file__).resolve().parent
        inputs_dir = base_dir / "inputs"
        outputs_dir = base_dir / "outputs"
        raw_dir = inputs_dir / "raw"
        ocr_output_file = inputs_dir / "bills_cleaned.txt"
        json_file = outputs_dir / "expenses_table.json"
        raw_dir.mkdir(parents=True, exist_ok=True)
        outputs_dir.mkdir(parents=True, exist_ok=True)

        # Save uploaded image into inputs/raw
        saved_path = raw_dir / filename
        with open(saved_path, "wb") as f:
            f.write(binary)

        # Import and run the new pipeline
        import sys

        ocr_dir = base_dir / "OCR"
        sys.path.insert(0, str(ocr_dir))

        from main import main

        # Run preprocessing -> OCR -> extraction
        main()

        # Verify OCR output exists
        if not ocr_output_file.exists():
            return jsonify({"error": "OCR output missing"}), 500

        extracted_text = ocr_output_file.read_text(encoding="utf-8").strip()
        if not extracted_text:
            return jsonify({"error": "No text extracted from image"}), 500

        # Verify JSON output exists
        if not json_file.exists():
            return jsonify({"error": "JSON output missing"}), 500

        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        return jsonify({
            'ok': True,
            'data': data,
            'files': {
                'json': str(json_file),
            },
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('ML_PORT') or os.getenv('PORT', '5001'))
    debug_enabled = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug_enabled)
