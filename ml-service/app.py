from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pathlib import Path
from datetime import datetime, timezone
from category_predictor import CategoryPredictor

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


def to_iso_utc(unix_timestamp):
    return datetime.fromtimestamp(unix_timestamp, tz=timezone.utc).isoformat()


def build_predictor_status(user_id='default'):
    predictor = get_predictor(user_id)
    model_path = Path(predictor.model_path)
    user_prefs_path = Path(predictor.user_prefs_path)

    model_exists = model_path.exists()
    model_size_bytes = None
    model_updated_at = None
    if model_exists:
        model_stats = model_path.stat()
        model_size_bytes = model_stats.st_size
        model_updated_at = to_iso_utc(model_stats.st_mtime)

    preferences_exists = user_prefs_path.exists()
    preferences_size_bytes = None
    preferences_updated_at = None
    if preferences_exists:
        preferences_stats = user_prefs_path.stat()
        preferences_size_bytes = preferences_stats.st_size
        preferences_updated_at = to_iso_utc(preferences_stats.st_mtime)

    return {
        'user_id': user_id,
        'predictor_loaded_in_memory': bool(predictor.model is not None),
        'model_path_template': MODEL_PATH_TEMPLATE,
        'model_path': str(model_path),
        'model_exists': model_exists,
        'model_size_bytes': model_size_bytes,
        'model_updated_at': model_updated_at,
        'user_preferences_path': str(user_prefs_path),
        'user_preferences_exists': preferences_exists,
        'user_preferences_size_bytes': preferences_size_bytes,
        'user_preferences_updated_at': preferences_updated_at,
        'cached_predictors': len(user_predictors),
    }

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


@app.route('/api/model-status', methods=['GET'])
def model_status():
    """Report model artifact and in-memory loading status for deployment verification."""
    try:
        user_id = request.args.get('user_id', 'default')
        status_payload = build_predictor_status(user_id)
        return jsonify(status_payload)
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

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5001'))
    debug_enabled = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug_enabled)
