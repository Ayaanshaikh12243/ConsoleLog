# STRATUM — Autonomous Planetary Infrastructure Intelligence

STRATUM is a next-generation geospatial AI system designed for real-time monitoring of planetary infrastructure. It utilizes a multi-agent backend to detect, investigate, and predict environmental and structural risks.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.10+
- Mapbox Access Token (for the interactive map)

### Running with Docker (Recommended)
```bash
docker-compose up --build
```

### Local Development

#### Backend
```bash
cd backend
pip install -r requirements.txt
python app/main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🧠 System Architecture

- **CORTEX**: Orchestrates agent spawns and risk priority.
- **SENTINEL**: H3-grid based monitoring (Vegetation, Moisture, Seismic).
- **PROBE**: Deep investigation and causal inference (DoWhy).
- **VERITAS**: Ground-truth verification via secondary sources.
- **ORACLE**: Risk forecasting (Monte Carlo simulations).
- **SCRIBE**: Report generation for stakeholders.
- **MERIDIAN**: Self-learning and threshold recalibration.

## 🌐 Tech Stack
- **Frontend**: React, Tailwind CSS, Mapbox GL, Deck.gl, H3, Framer Motion.
- **Backend**: FastAPI, PostgreSQL + PostGIS, Redis.
- **AI/ML**: PyTorch, Scikit-learn, DoWhy, Prophet.
