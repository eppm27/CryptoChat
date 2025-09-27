const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { verifyToken } = require("../middleware/authMiddleware");

// Chat routes
router.get("/:chatId/messages", verifyToken, chatController.getMessages);
router.delete("/:chatId", verifyToken, chatController.deleteChat);

router.post("/", verifyToken, chatController.createChat);
router.get("/", verifyToken, chatController.getAllChats);

// Message routes
router.post("/:chatId/messages", verifyToken, chatController.addMessage);
router.get(
  "/:chatId/messages/stream",
  verifyToken,
  chatController.streamMessage
);

module.exports = router;
