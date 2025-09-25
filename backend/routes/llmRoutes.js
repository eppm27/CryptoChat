const express = require("express");
const router = express.Router();
const llmController = require("../controllers/llmController");
const { verifyToken } = require("../middleware/authMiddleware");

// define POST endpoint for LLM query
router.post("/ask-llm", verifyToken, llmController.askLLM);

module.exports = router;
