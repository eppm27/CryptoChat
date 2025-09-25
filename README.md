# Crypto Chat Project

A full-stack cryptocurrency trading and chat application built with React, Node.js, and MongoDB.

## �� Features

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
- OpenAI (Chat functionality)

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Docker)
- Docker (optional, for containerized deployment)

## 🔧 Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd crypto-chat-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Set up environment variables**
   - Copy the `.env` file and update with your API keys

4. **Start MongoDB**
   ```bash
   docker run -d --name mongodb -p 27017:27017 mongo:6
   ```

5. **Run the application**
   ```bash
   # Backend
   cd backend && node index.js
   
   # Frontend (new terminal)
   cd frontend && npm run dev
   ```

## 🌐 Environment Variables

Required API keys in `.env`:
- MONGODB_URI
- JWT_SECRET
- OPENAI_API_KEY
- ALPHA_VANTAGE_API_KEY
- TWELVE_DATA_API_KEY

## 📱 Usage

1. Register/Login to create an account
2. Explore real-time cryptocurrency markets
3. Use the AI-powered chat system
4. Read the latest crypto news
5. Manage your portfolio

## 🤝 Made by

Created by Ellis Mon as a personal cryptocurrency trading and chat application.

---

**Made with ❤️ using React, Node.js, and MongoDB**
