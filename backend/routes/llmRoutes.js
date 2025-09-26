const express = require("express");
const router = express.Router();
const llmController = require("../controllers/llmController");
const { verifyToken } = require("../middleware/authMiddleware");

// define POST endpoint for LLM query
router.post("/ask-llm", verifyToken, llmController.askLLM);

// Chat-specific LLM endpoint
router.post("/chat/:chatId", verifyToken, llmController.chatLLM);

module.exports = router;
