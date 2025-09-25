// Routes/endpoints for the API

const express = require("express");
const router = express.Router();
const APIController = require("../controllers/APIController");
const { verifyToken } = require("../middleware/authMiddleware");

// Route for updating all data
router.post("/update-all-data", APIController.updateAllData);

// Route to update specific data
router.put("/update-data", APIController.updateData);

// Route for getting technical data for a specific crypto
router.get("/technical-data/:symbol", verifyToken, async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await APIController.getTechnicalData(symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
