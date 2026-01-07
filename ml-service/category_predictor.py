import numpy as np
import pickle
import os
import json
from difflib import SequenceMatcher
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from googletrans import Translator

class CategoryPredictor:
    def __init__(self, model_path='model.pkl', user_id='default'):
        self.model_path = model_path
        self.user_id = user_id
        self.user_prefs_path = f'user_preferences_{user_id}.json'
        self.model = None
        self.translator = Translator()
        self.user_preferences = {}
        self.load_model()
        self.load_user_preferences()
        
        # Load category mappings from JSON file
        with open('category_keywords.json', 'r') as f:
            self.keyword_map = json.load(f)
        
        # Load regional keywords
        try:
            with open('regional_keywords.json', 'r') as f:
                regional_data = json.load(f)
                # Flatten all regional keywords into main map
                for lang, keywords in regional_data.items():
                    self.keyword_map.update(keywords)
        except:
            pass
    
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
    
    def load_user_preferences(self):
        """Load user-defined title->category preferences"""
        if os.path.exists(self.user_prefs_path):
            try:
                with open(self.user_prefs_path, 'r') as f:
                    self.user_preferences = json.load(f)
                print(f"Loaded {len(self.user_preferences)} user preferences")
            except Exception as e:
                print(f"Error loading user preferences: {e}")
                self.user_preferences = {}
        else:
            self.user_preferences = {}
    
    def save_user_preferences(self):
        """Save user preferences to file"""
        try:
            with open(self.user_prefs_path, 'w') as f:
                json.dump(self.user_preferences, f, indent=2)
            print(f"User preferences saved")
        except Exception as e:
            print(f"Error saving user preferences: {e}")
    
    def learn_from_user(self, title, category):
        """Learn from user's manual category assignment"""
        # Normalize title (lowercase, strip whitespace)
        normalized_title = title.lower().strip()
        
        # Store the preference
        self.user_preferences[normalized_title] = category
        self.save_user_preferences()
        print(f"Learned: '{title}' -> {category}")
    
    def fuzzy_match(self, word1, word2, threshold=0.8):
        """Check if two words are similar using fuzzy matching"""
        return SequenceMatcher(None, word1, word2).ratio() >= threshold
    
    def translate_to_english(self, title):
        """Translate title to English if it's in another language"""
        try:
            # Detect and translate
            result = self.translator.translate(title, dest='en')
            if result.src != 'en':
                print(f"Translation: '{title}' ({result.src}) → '{result.text}' (en)")
                return result.text
            return title
        except Exception as e:
            print(f"Translation error: {e}")
            return title
    
    def predict_by_keywords(self, title):
        """Predict category based on keywords with fuzzy matching"""
        # First translate to English if needed
        title_translated = self.translate_to_english(title)
        title_lower = title_translated.lower().strip()
        title_words = title_lower.split()
        
        # Priority 1: Check user preferences (highest priority)
        if title_lower in self.user_preferences:
            category = self.user_preferences[title_lower]
            print(f"User preference match: '{title}' -> {category}")
            return category, 0.95  # Very high confidence for user preferences
        
        # Priority 2: Try exact match with keywords
        for keyword, category in self.keyword_map.items():
            # Check if keyword is a complete word match or surrounded by spaces
            if f' {keyword} ' in f' {title_lower} ' or title_lower == keyword:
                return category, 0.85  # High confidence for exact matches
        
        # Try fuzzy matching for spelling mistakes
        best_match = None
        best_ratio = 0.75  # Minimum similarity threshold
        best_keyword = None
        
        for keyword, category in self.keyword_map.items():
            keyword_words = keyword.split()
            
            # Check each word in title against keyword
            for title_word in title_words:
                # Skip very short words to avoid false matches
                if len(title_word) < 3:
                    continue
                    
                for keyword_word in keyword_words:
                    # Only compare if lengths are similar (within 1 character for short words)
                    len_diff = abs(len(title_word) - len(keyword_word))
                    if len(keyword_word) <= 4 and len_diff > 1:
                        continue
                    if len(keyword_word) > 4 and len_diff > 2:
                        continue
                    
                    ratio = SequenceMatcher(None, title_word, keyword_word).ratio()
                    
                    # Heavily penalize length mismatches
                    length_penalty = 1 - (len_diff * 0.2)
                    
                    # Prioritize exact length matches and longer words
                    score = ratio * length_penalty * min(len(keyword_word), 10)
                    
                    if ratio >= 0.75 and score > best_ratio:
                        best_ratio = score
                        best_match = category
                        best_keyword = keyword_word
        
        if best_match:
            # Lower confidence for fuzzy matches
            confidence = 0.75 if best_ratio >= 0.85 else 0.65
            print(f"Fuzzy match: '{title_lower}' → '{best_keyword}' → {best_match} (ratio: {best_ratio:.2f})")
            return best_match, confidence
        
        return None, 0.0
    
    def predict(self, title, amount=None):
        """Predict category for a given expense title"""
        # First try keyword-based prediction (with fuzzy matching)
        keyword_category, keyword_confidence = self.predict_by_keywords(title)
        if keyword_category:
            return keyword_category, keyword_confidence
        
        # If model is trained, use it
        if self.model:
            try:
                # Create feature from title only
                feature_text = self._create_feature(title)
                prediction = self.model.predict([feature_text])[0]
                
                # Get prediction probabilities for confidence
                probabilities = self.model.predict_proba([feature_text])[0]
                confidence = max(probabilities)
                
                return prediction, confidence
            except Exception as e:
                print(f"Prediction error: {e}")
        
        # Fallback to uncategorized
        return 'uncategorized', 0.3
    
    def _create_feature(self, title):
        """Create feature string from title only"""
        # Convert title to lowercase for consistency
        title_lower = title.lower()
        return title_lower
    
    def train(self, expenses):
        """Train the model with expense data"""
        if len(expenses) < 10:
            raise ValueError("Need at least 10 expenses to train the model")
        
        # Prepare training data
        X = []
        y = []
        
        for expense in expenses:
            title = expense.get('title', '')
            category = expense.get('category', 'uncategorized')
            
            if title and category:
                feature_text = self._create_feature(title)
                X.append(feature_text)
                y.append(category)
        
        if len(X) < 10:
            raise ValueError("Not enough valid training data")
        
        # For small datasets, use smaller test split
        test_size = 0.1 if len(X) < 30 else 0.2
        
        # Check if stratification is possible (all classes need at least 2 samples)
        from collections import Counter
        class_counts = Counter(y)
        can_stratify = all(count >= 2 for count in class_counts.values())
        
        # Split data for training and validation
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, 
            stratify=y if can_stratify else None
        )
        
        # Create and train the model pipeline with better parameters
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(
                max_features=500,  # Increased from 100
                ngram_range=(1, 3),  # Added trigrams
                min_df=1,  # Include rare words
                sublinear_tf=True,  # Use log scaling
                strip_accents='unicode'
            )),
            ('clf', MultinomialNB(alpha=0.01))  # Reduced smoothing for small data
        ])
        
        self.model.fit(X_train, y_train)
        
        # Calculate accuracy
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save the model
        self.save_model()
        
        print(f"Model trained with accuracy: {accuracy:.2f}")
        return accuracy
