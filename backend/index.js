require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
app.use(cookieParser());

// To parse JSON requests
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true, // For cookies
  })
);

// import routes
const llmRoutes = require('./routes/llmRoutes');
app.use('/api', llmRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const walletRoutes = require('./routes/userRoutes');
app.use('/user', walletRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

const apiRoutes = require('./routes/APIRoutes');
app.use('/api', apiRoutes);

const newsRoutes = require('./routes/newsRoutes');
app.use('/api/news', newsRoutes);

const frontendCryptoRoutes = require('./routes/frontendCryptoRoutes');
app.use('/api/crypto', frontendCryptoRoutes);

// rudimentary testing route
app.get('/', (req, res) => {
  res.send('Server is operational (thank God)');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { refreshNews } = require('./services/newsService');
refreshNews(); // Initial fetch
setInterval(refreshNews, 60 * 60 * 1000);

// update crypto date to mongo database hourly
const { updateCryptoInfoMongo } = require('./services/frontendCryptoService');
updateCryptoInfoMongo();
setInterval(updateCryptoInfoMongo, 60 * 60 * 1000);
