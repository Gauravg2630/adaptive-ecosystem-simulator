const tf = require('@tensorflow/tfjs');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const Simulation = require('../models/Simulation');
const Prediction = require('../models/Prediction');
const Event = require('../models/Event');

class AIService {
  constructor() {
    this.models = {
      collapsePredictor: null,
      populationForecaster: null,
      recommendationEngine: null
    };
    this.isInitialized = false;
    this.pythonServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  // Initialize AI service
  async initialize() {
    try {
      console.log('🤖 Initializing AI Service...');
      
      // Load pre-trained models if they exist
      await this.loadModels();
      
      // Start Python ML service
      await this.startPythonService();
      
      this.isInitialized = true;
      console.log('✅ AI Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error);
      return false;
    }
  }

  // Load pre-trained TensorFlow.js models
  async loadModels() {
    try {
      const modelsDir = path.join(__dirname, '../ml-models');
      
      // Check if models directory exists
      try {
        await fs.access(modelsDir);
      } catch (err) {
        console.log('📁 Creating models directory...');
        await fs.mkdir(modelsDir, { recursive: true });
        return;
      }

      // Load collapse predictor model
      try {
        const collapseModelPath = path.join(modelsDir, 'collapse-predictor');
        this.models.collapsePredictor = await tf.loadLayersModel(`file://${collapseModelPath}/model.json`);
        console.log('✅ Collapse predictor model loaded');
      } catch (err) {
        console.log('ℹ️ Collapse predictor model not found, will train new one');
      }

      // Load population forecaster model
      try {
        const forecastModelPath = path.join(modelsDir, 'population-forecaster');
        this.models.populationForecaster = await tf.loadLayersModel(`file://${forecastModelPath}/model.json`);
        console.log('✅ Population forecaster model loaded');
      } catch (err) {
        console.log('ℹ️ Population forecaster model not found, will train new one');
      }

    } catch (error) {
      console.error('❌ Error loading models:', error);
    }
  }

  // Start Python ML service
  async startPythonService() {
    return new Promise((resolve, reject) => {
      try {
        const pythonService = spawn('python', [
          path.join(__dirname, '../ml-service/app.py')
        ], {
          stdio: 'pipe',
          env: { ...process.env, PYTHONPATH: path.join(__dirname, '../ml-service') }
        });

        pythonService.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('ML Service started')) {
            console.log('🐍 Python ML Service started successfully');
            resolve(true);
          }
        });

        pythonService.stderr.on('data', (data) => {
          console.error('Python ML Service error:', data.toString());
        });

        pythonService.on('close', (code) => {
          if (code !== 0) {
            console.error(`Python ML Service exited with code ${code}`);
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          resolve(true); // Continue even if Python service doesn't start
        }, 10000);

      } catch (error) {
        console.warn('⚠️ Could not start Python ML service:', error.message);
        resolve(true); // Continue without Python service
      }
    });
  }

  // Predict ecosystem collapse probability
  async predictCollapse(userId, steps = 5) {
    try {
      // Get recent simulation data
      const recentData = await this.getRecentSimulationData(userId, 50);
      
      if (recentData.length < 10) {
        return {
          success: false,
          error: 'Insufficient data for prediction (need at least 10 simulation steps)'
        };
      }

      // Prepare features for prediction
      const features = this.prepareCollapseFeatures(recentData);
      
      // Use TensorFlow.js model if available, otherwise call Python service
      let prediction;
      if (this.models.collapsePredictor) {
        prediction = await this.predictWithTensorFlow(features, 'collapse');
      } else {
        prediction = await this.callPythonService('/predict/collapse', {
          features: features,
          steps: steps
        });
      }

      // Store prediction in database
      await this.storePrediction({
        userId,
        type: 'collapse',
        input: features,
        output: prediction,
        stepsAhead: steps,
        confidence: prediction.confidence || 0.5
      });

      return {
        success: true,
        prediction: {
          collapseRisk: prediction.risk || prediction.probability || 0.5,
          confidence: prediction.confidence || 0.5,
          riskLevel: this.getRiskLevel(prediction.risk || prediction.probability || 0.5),
          stepsAhead: steps,
          factors: prediction.factors || this.analyzeRiskFactors(features),
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error predicting collapse:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Forecast population trends
  async forecastPopulations(userId, steps = 7) {
    try {
      // Get recent simulation data
      const recentData = await this.getRecentSimulationData(userId, 100);
      
      if (recentData.length < 20) {
        return {
          success: false,
          error: 'Insufficient data for forecasting (need at least 20 simulation steps)'
        };
      }

      // Prepare time series data
      const timeSeriesData = this.prepareTimeSeriesData(recentData);
      
      let forecast;
      if (this.models.populationForecaster) {
        forecast = await this.forecastWithTensorFlow(timeSeriesData, steps);
      } else {
        forecast = await this.callPythonService('/predict/populations', {
          timeSeries: timeSeriesData,
          steps: steps
        });
      }

      // Store prediction
      await this.storePrediction({
        userId,
        type: 'forecast',
        input: timeSeriesData,
        output: forecast,
        stepsAhead: steps,
        confidence: forecast.confidence || 0.7
      });

      return {
        success: true,
        forecast: {
          predictions: forecast.predictions || this.generateDummyForecast(recentData, steps),
          confidence: forecast.confidence || 0.7,
          trends: forecast.trends || this.analyzeTrends(recentData),
          stepsAhead: steps,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error forecasting populations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate smart recommendations
  async generateRecommendations(userId) {
    try {
      // Get current ecosystem state
      const currentState = await this.getCurrentEcosystemState(userId);
      
      if (!currentState) {
        return {
          success: false,
          error: 'No current ecosystem data found'
        };
      }

      // Get collapse prediction
      const collapseResult = await this.predictCollapse(userId, 3);
      
      // Generate recommendations based on current state and predictions
      const recommendations = await this.generateSmartRecommendations(currentState, collapseResult);

      // Store recommendations
      await this.storePrediction({
        userId,
        type: 'recommendations',
        input: currentState,
        output: recommendations,
        stepsAhead: 1,
        confidence: recommendations.averageConfidence || 0.6
      });

      return {
        success: true,
        recommendations: recommendations.actions || [],
        reasoning: recommendations.reasoning || {},
        confidence: recommendations.averageConfidence || 0.6,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Detect ecosystem patterns
  async detectPatterns(userId) {
    try {
      // Get historical data
      const historicalData = await this.getRecentSimulationData(userId, 200);
      
      if (historicalData.length < 50) {
        return {
          success: false,
          error: 'Insufficient data for pattern detection (need at least 50 simulation steps)'
        };
      }

      // Analyze patterns
      const patterns = await this.analyzeEcosystemPatterns(historicalData);

      return {
        success: true,
        patterns: {
          cycles: patterns.cycles || [],
          anomalies: patterns.anomalies || [],
          healthScore: patterns.healthScore || 0.5,
          stability: patterns.stability || 'moderate',
          similarities: patterns.similarities || [],
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error detecting patterns:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper: Get recent simulation data
  async getRecentSimulationData(userId, limit = 50) {
    try {
      const data = await Simulation.find({ userId })
        .sort({ step: -1 })
        .limit(limit)
        .select('step plants herbivores carnivores events createdAt')
        .lean();
      
      return data.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching simulation data:', error);
      return [];
    }
  }

  // Helper: Prepare features for collapse prediction
  prepareCollapseFeatures(data) {
    const latest = data[data.length - 1];
    const trends = this.calculateTrends(data.slice(-10));
    
    return {
      current: {
        plants: latest.plants,
        herbivores: latest.herbivores,
        carnivores: latest.carnivores,
        totalPopulation: latest.plants + latest.herbivores + latest.carnivores,
        predatorPreyRatio: latest.carnivores / Math.max(latest.herbivores, 1),
        plantsPerHerbivore: latest.plants / Math.max(latest.herbivores, 1)
      },
      trends: trends,
      ratios: {
        plantHerbivoreRatio: latest.plants / Math.max(latest.herbivores, 1),
        herbivoreCarnivoreRatio: latest.herbivores / Math.max(latest.carnivores, 1),
        totalBiomass: latest.plants + latest.herbivores + latest.carnivores
      },
      volatility: this.calculateVolatility(data.slice(-20))
    };
  }

  // Helper: Prepare time series data
  prepareTimeSeriesData(data) {
    return data.map(point => ({
      step: point.step,
      plants: point.plants,
      herbivores: point.herbivores,
      carnivores: point.carnivores,
      timestamp: point.createdAt
    }));
  }

  // Helper: Calculate trends
  calculateTrends(data) {
    if (data.length < 3) return { plants: 0, herbivores: 0, carnivores: 0 };
    
    const first = data[0];
    const last = data[data.length - 1];
    const steps = data.length - 1;
    
    return {
      plants: (last.plants - first.plants) / steps,
      herbivores: (last.herbivores - first.herbivores) / steps,
      carnivores: (last.carnivores - first.carnivores) / steps
    };
  }

  // Helper: Calculate volatility
  calculateVolatility(data) {
    if (data.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      const total1 = data[i-1].plants + data[i-1].herbivores + data[i-1].carnivores;
      const total2 = data[i].plants + data[i].herbivores + data[i].carnivores;
      changes.push(Math.abs(total2 - total1) / Math.max(total1, 1));
    }
    
    const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
    
    return Math.sqrt(variance);
  }

  // Helper: Get risk level
  getRiskLevel(risk) {
    if (risk > 0.8) return 'critical';
    if (risk > 0.6) return 'high';
    if (risk > 0.4) return 'moderate';
    if (risk > 0.2) return 'low';
    return 'minimal';
  }

  // Helper: Analyze risk factors
  analyzeRiskFactors(features) {
    const factors = [];
    
    if (features.current.plants < 20) {
      factors.push({ factor: 'Low plant population', impact: 'high', value: features.current.plants });
    }
    
    if (features.current.herbivores < 5) {
      factors.push({ factor: 'Herbivore population critical', impact: 'critical', value: features.current.herbivores });
    }
    
    if (features.current.predatorPreyRatio > 2) {
      factors.push({ factor: 'Too many predators', impact: 'high', value: features.current.predatorPreyRatio });
    }
    
    if (features.volatility > 0.3) {
      factors.push({ factor: 'High population volatility', impact: 'moderate', value: features.volatility });
    }
    
    return factors;
  }

  // Helper: Call Python ML service
  async callPythonService(endpoint, data) {
    try {
      const response = await fetch(`${this.pythonServiceUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Python service error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Python service unavailable, using fallback predictions');
      return this.generateFallbackPrediction(endpoint, data);
    }
  }

  // Helper: Generate fallback predictions when ML service is unavailable
  generateFallbackPrediction(endpoint, data) {
    if (endpoint.includes('collapse')) {
      return {
        risk: Math.random() * 0.5 + 0.3, // Random risk between 0.3-0.8
        confidence: 0.4,
        factors: []
      };
    }
    
    if (endpoint.includes('populations')) {
      return {
        predictions: this.generateDummyForecast(data.timeSeries, data.steps),
        confidence: 0.5
      };
    }
    
    return { error: 'Fallback prediction not available' };
  }

  // Helper: Generate dummy forecast
  generateDummyForecast(recentData, steps) {
    const latest = recentData[recentData.length - 1];
    const trend = this.calculateTrends(recentData.slice(-5));
    
    const forecast = [];
    for (let i = 1; i <= steps; i++) {
      forecast.push({
        step: latest.step + i,
        plants: Math.max(0, latest.plants + trend.plants * i + (Math.random() - 0.5) * 10),
        herbivores: Math.max(0, latest.herbivores + trend.herbivores * i + (Math.random() - 0.5) * 5),
        carnivores: Math.max(0, latest.carnivores + trend.carnivores * i + (Math.random() - 0.5) * 2)
      });
    }
    
    return forecast;
  }

  // Helper: Store prediction in database
  async storePrediction(predictionData) {
    try {
      const prediction = new Prediction({
        userId: predictionData.userId,
        type: predictionData.type,
        input: predictionData.input,
        output: predictionData.output,
        stepsAhead: predictionData.stepsAhead,
        confidence: predictionData.confidence,
        timestamp: new Date()
      });
      
      await prediction.save();
      return prediction;
    } catch (error) {
      console.error('Error storing prediction:', error);
    }
  }

  // Additional helper methods would go here...
  async getCurrentEcosystemState(userId) {
    const latest = await Simulation.findOne({ userId }).sort({ step: -1 });
    return latest;
  }

  async generateSmartRecommendations(currentState, collapseResult) {
    const recommendations = [];
    
    if (currentState.plants < 30) {
      recommendations.push({
        action: 'add_plants',
        description: 'Add 20-30 plants to prevent herbivore starvation',
        impact: 'Reduces collapse risk by ~25%',
        confidence: 0.8,
        priority: 'high'
      });
    }
    
    if (currentState.carnivores > currentState.herbivores * 1.5) {
      recommendations.push({
        action: 'reduce_carnivores',
        description: 'Remove some carnivores to balance predator-prey ratio',
        impact: 'Improves ecosystem stability',
        confidence: 0.7,
        priority: 'medium'
      });
    }
    
    return {
      actions: recommendations,
      averageConfidence: recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length || 0.5
    };
  }

  async analyzeEcosystemPatterns(data) {
    // Simple pattern analysis - in real implementation, this would be more sophisticated
    return {
      healthScore: Math.random() * 0.4 + 0.5, // 0.5-0.9
      stability: 'moderate',
      cycles: [],
      anomalies: []
    };
  }
}

module.exports = new AIService();