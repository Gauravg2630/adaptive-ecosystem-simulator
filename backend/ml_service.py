#!/usr/bin/env python3
"""
AI-Powered Ecosystem Prediction Service
Provides machine learning endpoints for ecosystem analysis
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional, Tuple

# ML Libraries
try:
    import tensorflow as tf
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    from sklearn.preprocessing import StandardScaler, MinMaxScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, mean_squared_error
    import joblib
except ImportError as e:
    print(f"Warning: Some ML libraries not available: {e}")
    print("Install with: pip install tensorflow scikit-learn pandas numpy")

# Web Framework
try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
except ImportError:
    print("Install Flask with: pip install flask flask-cors")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class EcosystemPredictor:
    """Main AI predictor class for ecosystem analysis"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.is_trained = False
        self.model_dir = os.path.join(os.path.dirname(__file__), 'trained_models')
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Load existing models if available
        self.load_models()
    
    def prepare_features(self, data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features from ecosystem data"""
        if len(data) < 10:
            raise ValueError("Insufficient data for prediction (need at least 10 data points)")
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Create features
        features = []
        targets = []
        
        for i in range(5, len(df)):  # Use 5-step lookback window
            lookback = df.iloc[i-5:i]
            
            # Basic features
            feature_row = [
                # Current populations
                lookback.iloc[-1]['plants'],
                lookback.iloc[-1]['herbivores'],
                lookback.iloc[-1]['carnivores'],
                
                # Population trends (5-step)
                (lookback.iloc[-1]['plants'] - lookback.iloc[0]['plants']) / 5,
                (lookback.iloc[-1]['herbivores'] - lookback.iloc[0]['herbivores']) / 5,
                (lookback.iloc[-1]['carnivores'] - lookback.iloc[0]['carnivores']) / 5,
                
                # Ratios
                lookback.iloc[-1]['plants'] / max(lookback.iloc[-1]['herbivores'], 1),
                lookback.iloc[-1]['herbivores'] / max(lookback.iloc[-1]['carnivores'], 1),
                lookback.iloc[-1]['carnivores'] / max(lookback.iloc[-1]['herbivores'], 1),
                
                # Total biomass
                lookback.iloc[-1]['plants'] + lookback.iloc[-1]['herbivores'] + lookback.iloc[-1]['carnivores'],
                
                # Volatility (standard deviation of changes)
                np.std([lookback.iloc[j]['plants'] for j in range(len(lookback))]),
                np.std([lookback.iloc[j]['herbivores'] for j in range(len(lookback))]),
                np.std([lookback.iloc[j]['carnivores'] for j in range(len(lookback))]),
                
                # Min/max in window
                min(lookback['plants']),
                max(lookback['plants']),
                min(lookback['herbivores']),
                max(lookback['herbivores']),
                min(lookback['carnivores']),
                max(lookback['carnivores'])
            ]
            
            features.append(feature_row)
            
            # Target: will ecosystem collapse in next step?
            next_step = df.iloc[i]
            collapse = (next_step['plants'] < 5 or 
                       next_step['herbivores'] == 0 or 
                       next_step['carnivores'] == 0)
            targets.append(1 if collapse else 0)
        
        return np.array(features), np.array(targets)
    
    def train_collapse_predictor(self, ecosystem_data: List[Dict]) -> Dict:
        """Train collapse prediction model"""
        try:
            logger.info("Training collapse prediction model...")
            
            # Prepare features
            X, y = self.prepare_features(ecosystem_data)
            
            if len(X) < 20:
                return {
                    "success": False,
                    "error": "Insufficient training data (need at least 30 data points)"
                }
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train Random Forest model
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            model.fit(X_train_scaled, y_train)
            
            # Evaluate
            train_accuracy = model.score(X_train_scaled, y_train)
            test_accuracy = model.score(X_test_scaled, y_test)
            
            # Save model and scaler
            self.models['collapse'] = model
            self.scalers['collapse'] = scaler
            
            # Save to disk
            joblib.dump(model, os.path.join(self.model_dir, 'collapse_model.pkl'))
            joblib.dump(scaler, os.path.join(self.model_dir, 'collapse_scaler.pkl'))
            
            logger.info(f"Collapse model trained - Train accuracy: {train_accuracy:.3f}, Test accuracy: {test_accuracy:.3f}")
            
            return {
                "success": True,
                "model_type": "collapse_predictor",
                "train_accuracy": train_accuracy,
                "test_accuracy": test_accuracy,
                "training_samples": len(X_train),
                "features": len(X_train[0])
            }
            
        except Exception as e:
            logger.error(f"Error training collapse model: {e}")
            return {"success": False, "error": str(e)}
    
    def predict_collapse_risk(self, recent_data: List[Dict], steps_ahead: int = 5) -> Dict:
        """Predict ecosystem collapse probability"""
        try:
            if 'collapse' not in self.models:
                # Use simple heuristic if no trained model
                return self._heuristic_collapse_prediction(recent_data)
            
            # Prepare features from recent data
            if len(recent_data) < 5:
                raise ValueError("Need at least 5 recent data points")
            
            # Use last 5 data points as features
            lookback = recent_data[-5:]
            
            # Create feature vector (same as training)
            features = [
                # Current populations
                lookback[-1]['plants'],
                lookback[-1]['herbivores'],
                lookback[-1]['carnivores'],
                
                # Trends
                (lookback[-1]['plants'] - lookback[0]['plants']) / 5,
                (lookback[-1]['herbivores'] - lookback[0]['herbivores']) / 5,
                (lookback[-1]['carnivores'] - lookback[0]['carnivores']) / 5,
                
                # Ratios
                lookback[-1]['plants'] / max(lookback[-1]['herbivores'], 1),
                lookback[-1]['herbivores'] / max(lookback[-1]['carnivores'], 1),
                lookback[-1]['carnivores'] / max(lookback[-1]['herbivores'], 1),
                
                # Total biomass
                sum([lookback[-1][pop] for pop in ['plants', 'herbivores', 'carnivores']]),
                
                # Volatility
                np.std([d['plants'] for d in lookback]),
                np.std([d['herbivores'] for d in lookback]),
                np.std([d['carnivores'] for d in lookback]),
                
                # Min/max
                min([d['plants'] for d in lookback]),
                max([d['plants'] for d in lookback]),
                min([d['herbivores'] for d in lookback]),
                max([d['herbivores'] for d in lookback]),
                min([d['carnivores'] for d in lookback]),
                max([d['carnivores'] for d in lookback])
            ]
            
            # Scale features
            features_scaled = self.scalers['collapse'].transform([features])
            
            # Predict
            risk_probability = self.models['collapse'].predict_proba(features_scaled)[0][1]
            confidence = max(self.models['collapse'].predict_proba(features_scaled)[0])
            
            # Get feature importance for explanation
            feature_names = [
                'plants', 'herbivores', 'carnivores', 'plant_trend', 'herbivore_trend', 
                'carnivore_trend', 'plant_herb_ratio', 'herb_carn_ratio', 'carn_herb_ratio',
                'total_biomass', 'plant_volatility', 'herbivore_volatility', 'carnivore_volatility',
                'min_plants', 'max_plants', 'min_herbivores', 'max_herbivores', 
                'min_carnivores', 'max_carnivores'
            ]
            
            importance = self.models['collapse'].feature_importances_
            top_factors = sorted(zip(feature_names, importance), key=lambda x: x[1], reverse=True)[:5]
            
            return {
                "success": True,
                "risk": float(risk_probability),
                "confidence": float(confidence),
                "factors": [{"factor": name, "importance": float(imp)} for name, imp in top_factors],
                "model_version": "1.0"
            }
            
        except Exception as e:
            logger.error(f"Error predicting collapse risk: {e}")
            return self._heuristic_collapse_prediction(recent_data)
    
    def _heuristic_collapse_prediction(self, recent_data: List[Dict]) -> Dict:
        """Fallback heuristic prediction when ML model unavailable"""
        if not recent_data:
            return {"success": False, "error": "No data provided"}
        
        latest = recent_data[-1]
        risk = 0.0
        factors = []
        
        # Simple rule-based risk assessment
        if latest['plants'] < 10:
            risk += 0.4
            factors.append({"factor": "critically_low_plants", "importance": 0.4})
        elif latest['plants'] < 30:
            risk += 0.2
            factors.append({"factor": "low_plants", "importance": 0.2})
        
        if latest['herbivores'] < 3:
            risk += 0.3
            factors.append({"factor": "critically_low_herbivores", "importance": 0.3})
        
        if latest['carnivores'] > latest['herbivores'] * 1.5:
            risk += 0.2
            factors.append({"factor": "predator_overload", "importance": 0.2})
        
        # Check trends if we have enough data
        if len(recent_data) >= 3:
            recent_trend = recent_data[-3:]
            plant_trend = (recent_trend[-1]['plants'] - recent_trend[0]['plants']) / 3
            if plant_trend < -5:
                risk += 0.15
                factors.append({"factor": "declining_plant_trend", "importance": 0.15})
        
        return {
            "success": True,
            "risk": min(risk, 1.0),
            "confidence": 0.6,  # Lower confidence for heuristic
            "factors": factors,
            "model_version": "heuristic"
        }
    
    def forecast_populations(self, time_series_data: List[Dict], steps: int = 7) -> Dict:
        """Forecast future populations using simple trend analysis"""
        try:
            if len(time_series_data) < 5:
                raise ValueError("Need at least 5 data points for forecasting")
            
            # Convert to DataFrame
            df = pd.DataFrame(time_series_data)
            
            # Simple linear trend forecasting for each population
            forecasts = []
            
            for step in range(1, steps + 1):
                # Calculate trends for each population type
                recent_points = min(10, len(df))  # Use last 10 points for trend
                recent_data = df.tail(recent_points)
                
                # Linear regression for each population
                x = np.arange(len(recent_data))
                
                # Plants forecast
                plant_coef = np.polyfit(x, recent_data['plants'], 1)
                plant_forecast = plant_coef[0] * (len(recent_data) + step - 1) + plant_coef[1]
                
                # Herbivores forecast  
                herb_coef = np.polyfit(x, recent_data['herbivores'], 1)
                herb_forecast = herb_coef[0] * (len(recent_data) + step - 1) + herb_coef[1]
                
                # Carnivores forecast
                carn_coef = np.polyfit(x, recent_data['carnivores'], 1)
                carn_forecast = carn_coef[0] * (len(recent_data) + step - 1) + carn_coef[1]
                
                # Add some noise and ensure non-negative values
                noise_factor = 0.1 * step  # Uncertainty increases with time
                
                forecasts.append({
                    "step": df.iloc[-1]['step'] + step,
                    "plants": max(0, int(plant_forecast + np.random.normal(0, noise_factor * plant_forecast))),
                    "herbivores": max(0, int(herb_forecast + np.random.normal(0, noise_factor * herb_forecast))),
                    "carnivores": max(0, int(carn_forecast + np.random.normal(0, noise_factor * carn_forecast)))
                })
            
            # Calculate confidence (decreases with forecast horizon)
            base_confidence = 0.8
            confidence = base_confidence * (0.9 ** steps)
            
            # Analyze trends
            trends = {
                "plants": "stable",
                "herbivores": "stable", 
                "carnivores": "stable"
            }
            
            if len(df) >= 5:
                recent_5 = df.tail(5)
                for pop in ['plants', 'herbivores', 'carnivores']:
                    trend_slope = np.polyfit(range(5), recent_5[pop], 1)[0]
                    if trend_slope > 2:
                        trends[pop] = "increasing"
                    elif trend_slope < -2:
                        trends[pop] = "decreasing"
            
            return {
                "success": True,
                "predictions": forecasts,
                "confidence": float(confidence),
                "trends": trends,
                "forecast_horizon": steps
            }
            
        except Exception as e:
            logger.error(f"Error forecasting populations: {e}")
            return {"success": False, "error": str(e)}
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            collapse_model_path = os.path.join(self.model_dir, 'collapse_model.pkl')
            collapse_scaler_path = os.path.join(self.model_dir, 'collapse_scaler.pkl')
            
            if os.path.exists(collapse_model_path) and os.path.exists(collapse_scaler_path):
                self.models['collapse'] = joblib.load(collapse_model_path)
                self.scalers['collapse'] = joblib.load(collapse_scaler_path)
                logger.info("Collapse prediction model loaded successfully")
                self.is_trained = True
            else:
                logger.info("No pre-trained models found")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")

# Global predictor instance
predictor = EcosystemPredictor()

# API Routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "ML Prediction Service",
        "models_loaded": list(predictor.models.keys()),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/predict/collapse', methods=['POST'])
def predict_collapse():
    """Predict ecosystem collapse risk"""
    try:
        data = request.get_json()
        features = data.get('features', {})
        steps = data.get('steps', 5)
        
        # Convert features to the format expected by predictor
        recent_data = []
        if 'current' in features:
            # Convert feature format to data format
            recent_data = [{
                'plants': features['current']['plants'],
                'herbivores': features['current']['herbivores'], 
                'carnivores': features['current']['carnivores'],
                'step': 0
            }]
        
        # If we don't have enough data, return heuristic prediction
        if len(recent_data) < 1:
            return jsonify({
                "success": False,
                "error": "Invalid features format"
            })
        
        result = predictor.predict_collapse_risk(recent_data, steps)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in collapse prediction: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/predict/populations', methods=['POST'])
def predict_populations():
    """Forecast population trends"""
    try:
        data = request.get_json()
        time_series = data.get('timeSeries', [])
        steps = data.get('steps', 7)
        
        result = predictor.forecast_populations(time_series, steps)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in population forecasting: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/train', methods=['POST'])
def train_models():
    """Train ML models with provided data"""
    try:
        data = request.get_json()
        ecosystem_data = data.get('ecosystem_data', [])
        
        if len(ecosystem_data) < 50:
            return jsonify({
                "success": False,
                "error": "Need at least 50 data points for training"
            })
        
        # Train collapse predictor
        result = predictor.train_collapse_predictor(ecosystem_data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in model training: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting ML Prediction Service...")
    print("ML Service started on http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=False)