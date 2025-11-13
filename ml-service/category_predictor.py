import numpy as np
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

class CategoryPredictor:
    def __init__(self, model_path='model.pkl'):
        self.model_path = model_path
        self.model = None
        self.load_model()
        
        # Default category mappings for common keywords
        self.keyword_map = {
            'uber': 'cab',
            'ola': 'cab',
            'rapido': 'cab',
            'taxi': 'cab',
            'swiggy': 'dining',
            'zomato': 'dining',
            'restaurant': 'dining',
            'cafe': 'snacks',
            'coffee': 'snacks',
            'starbucks': 'snacks',
            'movie': 'movies',
            'cinema': 'movies',
            'pvr': 'movies',
            'inox': 'movies',
            'amazon': 'uncategorized',
            'flipkart': 'uncategorized',
            'grocery': 'groceries',
            'supermarket': 'groceries',
            'big basket': 'groceries',
            'dmart': 'groceries',
            'petrol': 'fuel',
            'diesel': 'fuel',
            'gas': 'fuel',
            'electricity': 'electricity',
            'water': 'water',
            'rent': 'rent',
            'gym': 'sports',
            'fitness': 'sports',
            'medicine': 'health',
            'doctor': 'health',
            'hospital': 'health',
            'pharmacy': 'health',
            'flight': 'flight',
            'train': 'train',
            'bus': 'bus',
            'metro': 'bus',
            'internet': 'internet',
            'wifi': 'internet',
            'phone': 'phone',
            'mobile': 'phone',
            'recharge': 'phone',
        }
    
    def load_model(self):
        """Load the trained model if it exists"""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                print(f"Model loaded from {self.model_path}")
            except Exception as e:
                print(f"Error loading model: {e}")
                self.model = None
        else:
            print("No pre-trained model found")
    
    def save_model(self):
        """Save the trained model"""
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            print(f"Model saved to {self.model_path}")
        except Exception as e:
            print(f"Error saving model: {e}")
    
    def predict_by_keywords(self, title):
        """Predict category based on keywords"""
        title_lower = title.lower()
        for keyword, category in self.keyword_map.items():
            if keyword in title_lower:
                return category, 0.85  # High confidence for keyword matches
        return None, 0.0
    
    def predict(self, title, amount=None):
        """Predict category for a given expense title and amount"""
        # First try keyword-based prediction
        keyword_category, keyword_confidence = self.predict_by_keywords(title)
        if keyword_category:
            return keyword_category, keyword_confidence
        
        # If model is trained, use it
        if self.model:
            try:
                # Create feature combining title and amount range
                feature_text = self._create_feature(title, amount)
                prediction = self.model.predict([feature_text])[0]
                
                # Get prediction probabilities for confidence
                probabilities = self.model.predict_proba([feature_text])[0]
                confidence = max(probabilities)
                
                return prediction, confidence
            except Exception as e:
                print(f"Prediction error: {e}")
        
        # Fallback to amount-based prediction
        return self._predict_by_amount(amount), 0.5
    
    def _create_feature(self, title, amount):
        """Create feature string combining title and amount range"""
        amount_range = ""
        if amount:
            if amount < 100:
                amount_range = "very_low"
            elif amount < 500:
                amount_range = "low"
            elif amount < 2000:
                amount_range = "medium"
            elif amount < 10000:
                amount_range = "high"
            else:
                amount_range = "very_high"
        
        return f"{title} {amount_range}"
    
    def _predict_by_amount(self, amount):
        """Simple rule-based prediction based on amount"""
        if not amount:
            return 'uncategorized'
        
        if amount < 100:
            return 'snacks'
        elif amount < 500:
            return 'groceries'
        elif amount < 2000:
            return 'dining'
        elif amount < 10000:
            return 'clothing'
        else:
            return 'rent'
    
    def train(self, expenses):
        """Train the model with expense data"""
        if len(expenses) < 10:
            raise ValueError("Need at least 10 expenses to train the model")
        
        # Prepare training data
        X = []
        y = []
        
        for expense in expenses:
            title = expense.get('title', '')
            amount = expense.get('amount', 0)
            category = expense.get('category', 'uncategorized')
            
            if title and category:
                feature_text = self._create_feature(title, amount)
                X.append(feature_text)
                y.append(category)
        
        if len(X) < 10:
            raise ValueError("Not enough valid training data")
        
        # Split data for training and validation
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Create and train the model pipeline
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=100, ngram_range=(1, 2))),
            ('clf', MultinomialNB(alpha=0.1))
        ])
        
        self.model.fit(X_train, y_train)
        
        # Calculate accuracy
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save the model
        self.save_model()
        
        print(f"Model trained with accuracy: {accuracy:.2f}")
        return accuracy
