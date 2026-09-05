# Crypto Chat Project

A full-stack cryptocurrency research and portfolio application built with React, Node.js, and MongoDB. It combines market data, financial news, portfolio tracking, and a Gemini-powered assistant.

## ✨ Features

- **Real-time Cryptocurrency Data**: Live price tracking and market information
- **AI-Powered Chat**: Interactive chat system with intelligent responses
- **User Authentication**: Secure login and registration system
- **News Aggregation**: Latest cryptocurrency news from multiple sources
- **Portfolio Management**: Track your crypto investments
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Axios for API calls

### Backend

- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- RESTful API design

### External APIs

- Alpha Vantage (Financial News)
- Twelve Data (Crypto Prices)
- Google Gemini (chat functionality)
- CoinGecko (market data)

## 📋 Prerequisites

- Node.js 20 or higher
- MongoDB (local or Docker)
- Docker (optional, for containerized deployment)

## 🔧 Installation

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/eppm27/CryptoChat.git
   cd CryptoChat
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Set up environment variables**

   ```bash
   cp backend/.env.example backend/.env
   ```

   Update `backend/.env` with your own database URL, secrets, and API keys.

4. **Start MongoDB**

   ```bash
   docker run -d --name mongodb -p 27017:27017 mongo:6
   ```

5. **Run the application**

   ```bash
   # Backend
   npm run start:backend

   # Frontend (new terminal)
   npm run start:frontend
   ```

## 🌐 Environment Variables

Required API keys in `.env`:

- MONGODB_URI
- JWT_SECRET
- GEMINI_API_KEY
- ALPHA_VANTAGE_API_KEY
- TWELVE_DATA_API_KEY

See `backend/.env.example` for the complete configuration. For deployment, set `NODE_ENV=production` and `FRONTEND_URL` to the deployed frontend origin.

## ✅ Quality checks

```bash
npm test
npm run lint
npm run build
```

## Project context

CryptoChat began as a UNSW COMP3900 team capstone project. This repository is maintained by Ellis Mon as a portfolio version of the application.

## 📱 Usage

1. Register/Login to create an account, or choose **Explore recruiter demo** to use sample data without credentials
2. Explore real-time cryptocurrency markets
3. Use the AI-powered chat system
4. Read the latest crypto news
5. Manage your portfolio

## 🚀 Deployment

The root `Dockerfile` produces one deployable image containing the Express API and compiled React frontend. This keeps authentication and API requests on the same origin and requires one web service plus MongoDB Atlas.

### Render Blueprint

1. Create a MongoDB Atlas cluster and obtain its connection string.
2. Create a Render Blueprint from this repository using `render.yaml`.
3. Set `MONGODB_URI` and `MONGODB_URI_CRYPTO` to the Atlas connection strings.
4. Set `FRONTEND_URL` to the final Render URL, such as `https://cryptochat.onrender.com`.
5. Add credentials for the live integrations you want enabled.
6. Deploy and confirm `/health` returns `{ "status": "ok" }`.

The recruiter demo remains usable when optional market, news, AI, and email credentials are not configured.

### Portfolio checklist

- Link directly to the deployed app and label it **Live demo**.
- State that recruiter-demo data is intentionally simulated.
- Include one dashboard screenshot and one AI-chat screenshot.
- Describe it as a team capstone and state your own contributions precisely.
- Never commit `.env`, Atlas credentials, email passwords, or API keys.

## 🤝 Made by

Created by Ellis Mon as a personal cryptocurrency trading and chat application.

---

**Made with ❤️ using React, Node.js, and MongoDB**
