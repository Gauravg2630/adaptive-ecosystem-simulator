# 🌱 Adaptive Ecosystem Simulator

> **A comprehensive real-time ecosystem simulation platform with AI-powered predictions and intelligent monitoring**

[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?logo=mongodb)](https://mongodb.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow.js-4.0+-orange?logo=tensorflow)](https://www.tensorflow.org/js)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [AI/ML Pipeline](#-aiml-pipeline)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

## 🎯 Overview

The **Adaptive Ecosystem Simulator** is a full-stack web application that models complex ecosystem dynamics with real-time population interactions. Built over **27 days of continuous development**, it features machine learning-powered predictions, intelligent monitoring, and comprehensive data visualization.

### 🌟 Key Highlights

- **Real-time Simulation Engine**: Dynamic population modeling with predator-prey relationships
- **AI-Powered Predictions**: 85% accuracy ecosystem collapse forecasting using TensorFlow.js
- **Intelligent Monitoring**: System health tracking with automated alerts
- **Interactive Dashboards**: Real-time data visualization with Recharts
- **WebSocket Integration**: Live updates across all connected clients
- **Production Ready**: Complete with authentication, error handling, and responsive design

## ✨ Features

### 🔬 Core Simulation
- **Population Dynamics**: Plants, Herbivores, and Carnivores with realistic interactions
- **Environmental Factors**: Carrying capacity, growth rates, and survival mechanics
- **Real-time Updates**: Live simulation with WebSocket synchronization
- **Pause/Resume Control**: Start, stop, and reset simulations dynamically

### 🤖 AI & Machine Learning
- **Collapse Prediction**: Forecasts ecosystem collapse risk 5 steps ahead
- **Population Forecasting**: 7-day ahead population trend predictions
- **Smart Recommendations**: AI-suggested interventions for ecosystem stability
- **Pattern Recognition**: Detects cycles and anomalies in ecosystem behavior
- **Self-Learning Models**: Continuous improvement with new simulation data

### 📊 Data & Analytics
- **Interactive Charts**: Line, area, bar, and radial charts with Recharts
- **Real-time Metrics**: CPU, memory, and connection monitoring
- **Historical Analysis**: Complete simulation history with trend analysis
- **Export Capabilities**: CSV and JSON data export functionality

### 🔐 User Management
- **Authentication**: JWT-based secure login/register system
- **User Profiles**: Personal dashboards and simulation history
- **Session Management**: Persistent login with token validation

### 📱 User Experience
- **Responsive Design**: Mobile-first responsive layout
- **Dark Mode**: Toggle between light and dark themes
- **Error Boundaries**: Graceful error handling with user-friendly messages
- **Loading States**: Smooth loading animations and skeleton screens

### 🚨 Monitoring & Alerts
- **System Health**: Real-time server and database monitoring
- **Intelligent Alerts**: Automated notifications for critical events
- **Event Logging**: Comprehensive activity logging and audit trails
- **Performance Metrics**: CPU, memory, and connection tracking

## 🛠 Tech Stack

### Frontend
- **React 18.2** - Modern UI library with hooks
- **Tailwind CSS 3.3** - Utility-first styling framework
- **Framer Motion 10** - Smooth animations and transitions
- **Recharts 2.8** - Responsive chart components
- **React Router 6** - Client-side routing
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js 18+** - JavaScript runtime environment
- **Express.js 4.18** - Fast web framework
- **MongoDB 6.0** - NoSQL database
- **Mongoose 7.5** - MongoDB object modeling
- **Socket.IO 4.7** - Real-time communication
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing

### AI/ML Stack
- **TensorFlow.js 4.10** - Browser-based machine learning
- **Python 3.9+** - ML service backend
- **scikit-learn 1.3** - Machine learning algorithms
- **pandas 2.0** - Data manipulation and analysis
- **Flask 2.3** - Python web microservice

### DevOps & Tools
- **Git** - Version control
- **npm/yarn** - Package management
- **dotenv** - Environment configuration
- **CORS** - Cross-origin resource sharing

## 🚀 Installation

### Prerequisites
- **Node.js** 18.0 or higher
- **Python** 3.9 or higher
- **MongoDB** 6.0 or higher
- **Git** for version control

### 1. Clone Repository
```bash
git clone https://github.com/Gauravg2630/adaptive-ecosystem-simulator.git
cd adaptive-ecosystem-simulator
```

### 2. Backend Setup
```bash
cd backend
npm install

# Install additional ML dependencies
npm install @tensorflow/tfjs-node

# Python ML service dependencies
pip install flask flask-cors scikit-learn pandas numpy tensorflow joblib
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Configuration

Create `.env` file in the backend directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecosystem-simulator
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
ML_SERVICE_URL=http://localhost:8000
```

Create `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

### 5. Database Setup
```bash
# Start MongoDB service
mongod

# The application will automatically create required collections
```

## 📦 Usage

### 1. Start the Backend Server
```bash
cd backend
npm start
```
Server runs on `http://localhost:5000`

### 2. Start the Python ML Service
```bash
cd backend/ml-service
python ml_service.py
```
ML service runs on `http://localhost:8000`

### 3. Start the Frontend
```bash
cd frontend
npm start
```
Application opens at `http://localhost:3000`

### 4. First Time Setup
1. **Register** a new account at `/register`
2. **Login** with your credentials
3. **Start a simulation** from the main dashboard
4. **Explore AI predictions** in the Predictions tab
5. **Monitor system health** in the Monitoring tab

## 📁 Project Structure

```
adaptive-ecosystem-simulator/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Main application pages
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── backend/
│   ├── controllers/            # Route controllers
│   ├── middleware/             # Express middleware
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic services
│   ├── ml-service/             # Python ML microservice
│   │   └── ml_service.py       # Flask ML API
│   ├── server.js               # Main server entry point
│   └── package.json
├── README.md
└── .gitignore
```

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/validate     # Token validation
GET  /api/auth/profile      # User profile
```

### Simulation Endpoints
```
POST /api/simulation/start  # Start new simulation
POST /api/simulation/stop   # Stop current simulation
POST /api/simulation/reset  # Reset simulation state
GET  /api/simulation/status # Get simulation status
GET  /api/simulation/history # Get simulation history
```

### AI Prediction Endpoints
```
POST /api/predictions/collapse      # Generate collapse prediction
POST /api/predictions/forecast      # Generate population forecast
POST /api/predictions/recommendations # Get smart recommendations
POST /api/predictions/patterns      # Analyze ecosystem patterns
GET  /api/predictions/stats         # Get prediction statistics
```

### Monitoring Endpoints
```
GET /api/monitor           # Get system status
GET /api/metrics           # Get performance metrics
GET /api/alerts            # Get system alerts
GET /api/events            # Get event logs
```

## 🧠 AI/ML Pipeline

### Machine Learning Models

1. **Collapse Predictor**
   - **Algorithm**: Random Forest Classifier
   - **Features**: 18 ecosystem indicators (population ratios, trends, volatility)
   - **Accuracy**: ~85% on test data
   - **Prediction Horizon**: 5 simulation steps

2. **Population Forecaster**
   - **Algorithm**: Linear Regression with trend analysis
   - **Features**: Historical population data, growth rates
   - **Confidence**: Decreases with forecast horizon
   - **Prediction Horizon**: 7 simulation steps

3. **Pattern Recognition**
   - **Algorithm**: Statistical analysis with anomaly detection
   - **Features**: Population cycles, stability metrics
   - **Output**: Health scores, stability classification

### Model Training Pipeline
```python
# Automatic retraining every 24 hours
# Uses latest simulation data
# Validates performance before deployment
# Maintains model versioning
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write unit tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 👨‍💻 Author

**Gorav Gumber**
- **Status**: BTech 3rd Year, Computer Science Engineering
- **GitHub**: [@goravgumber](https://github.com/Gauravg2630)
- **LinkedIn**: [Gorav Gumber](https://linkedin.com/in/gorav-gumber-9319a2342)
- **Email**: goravgumberg@gmail.com

### Development Journey
This project was built over **27 consecutive days** as part of a comprehensive full-stack development challenge, showcasing:
- Modern web development practices
- Real-time application architecture
- Machine learning integration
- Production-ready deployment strategies

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Gorav Gumber

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🎯 Roadmap

### Phase 1: Advanced AI Features
- [ ] Deep learning models with LSTM networks
- [ ] Multi-species ecosystem modeling
- [ ] Environmental factor simulation (weather, seasons)

### Phase 2: Collaboration Features
- [ ] Multi-user simulation environments
- [ ] Real-time collaboration tools
- [ ] Shared ecosystem experiments

### Phase 3: Deployment & Scaling
- [ ] Docker containerization
- [ ] AWS/Azure cloud deployment
- [ ] Kubernetes orchestration
- [ ] CDN integration

### Phase 4: Mobile Application
- [ ] React Native mobile app
- [ ] Offline simulation capabilities
- [ ] Push notifications for alerts

---

## 🙏 Acknowledgments

- **React Team** for the amazing frontend framework
- **MongoDB** for the flexible NoSQL database
- **TensorFlow** team for making ML accessible in JavaScript
- **Recharts** for beautiful data visualizations
- **Open Source Community** for countless helpful libraries

---

## ⭐ Star History

If you found this project helpful, please consider giving it a ⭐ star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=goravgumber/adaptive-ecosystem-simulator&type=Date)](https://star-history.com/#goravgumber/adaptive-ecosystem-simulator&Date)

---

**Built with ❤️ by Gorav Gumber | BTech CSE 3rd Year | 27 Days of Code**
