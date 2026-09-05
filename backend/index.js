require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;

const cors = require("cors");
app.set("trust proxy", 1);
app.disable("x-powered-by");
// The UI loads cryptocurrency artwork and article images from several external
// providers. Keep Helmet's transport/header protections while deployment
// providers and image domains are finalized for a strict CSP allowlist.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());

// To parse JSON requests
app.use(express.json({ limit: "1mb" }));
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
}));

// import routes
const llmRoutes = require("./routes/llmRoutes");
app.use("/api", llmRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), authRoutes);

const walletRoutes = require("./routes/userRoutes");
app.use("/user", walletRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);

const apiRoutes = require("./routes/APIRoutes");
app.use("/api", apiRoutes);

const newsRoutes = require("./routes/newsRoutes");
app.use("/api/news", newsRoutes);

const frontendCryptoRoutes = require("./routes/frontendCryptoRoutes");
app.use("/api/crypto", frontendCryptoRoutes);

// rudimentary testing route
app.get("/", (req, res) => {
  res.send("CryptoChat API is operational");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const frontendDist = process.env.FRONTEND_DIST || path.join(__dirname, "public");
if (process.env.SERVE_FRONTEND === "true" && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { maxAge: "1h" }));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { refreshNews } = require("./services/newsService");
refreshNews(); // Initial fetch
setInterval(refreshNews, 60 * 60 * 1000);

// update crypto date to mongo database hourly
const { updateCryptoInfoMongo } = require("./services/frontendCryptoService");
updateCryptoInfoMongo();
setInterval(updateCryptoInfoMongo, 60 * 60 * 1000);
