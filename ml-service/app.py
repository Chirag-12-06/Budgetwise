from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
from category_predictor import CategoryPredictor

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize the predictor
predictor = CategoryPredictor()

@app.route('/api/predict-category', methods=['POST'])
def predict_category():
    """Predict category based on expense title and amount"""
    try:
        data = request.json
        title = data.get('title', '')
        amount = data.get('amount', 0)
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        # Get prediction
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
        
        if not expenses or len(expenses) < 10:
            return jsonify({'error': 'At least 10 expenses required for training'}), 400
        
        # Train the model
        accuracy = predictor.train(expenses)
        
        return jsonify({
            'message': 'Model trained successfully',
            'accuracy': float(accuracy),
            'samples': len(expenses)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
