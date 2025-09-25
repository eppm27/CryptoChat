const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

router.post("/add-crypto", verifyToken, userController.addCryptoToWallet);

router.post(
  "/add-to-watchlist",
  verifyToken,
  userController.addCryptoToWatchlist
);

router.post("/add-saved-prompt", verifyToken, userController.addPromptToSaved);

router.get("/user-data", verifyToken, userController.getUserData);

router.delete(
  "/remove-from-watchlist",
  verifyToken,
  userController.deleteCryptoFromWatchlist
);

router.delete(
  "/remove-from-wallet",
  verifyToken,
  userController.deleteCryptoFromWallet
);

router.delete(
  "/remove-from-saved",
  verifyToken,
  userController.deleteCryptoFromSaved
);

router.put(
  "/update-crypto-amount",
  verifyToken,
  userController.updateCryptoAmountFromWallet
);

router.put("/update-user-info", verifyToken, userController.updateUserInfo);

module.exports = router;
