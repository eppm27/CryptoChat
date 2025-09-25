const User = require("../dbSchema/userSchema");
const mongoose = require("mongoose");

const addCryptoToWallet = async (req, res) => {
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { cryptoName, cryptoSymbol, cryptoId, amount } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          wallet: {
            cryptoName,
            cryptoSymbol,
            cryptoId,
            amount,
          },
        },
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Crypto added to wallet", wallet: updatedUser.wallet });
  } catch (error) {
    console.error("Error addingCryptoToWallet:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const addCryptoToWatchlist = async (req, res) => {
  console.log("i am in addCryptoToWatchlist--- before try");
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { cryptoName, cryptoSymbol, cryptoId } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          watchlist: {
            cryptoName,
            cryptoSymbol,
            cryptoId,
          },
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Crypto added to watchlist",
      watchlist: updatedUser.watchlist,
    });
  } catch (error) {
    console.error("Error addCryptoToWatchlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const addPromptToSaved = async (req, res) => {
  console.log("i am in addPromptToSaved--- before try");
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { savePrompt } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { savedPrompts: { prompt: savePrompt } } },
      { new: true }
    );

    res.status(200).json({
      message: "Prompt added to Saved",
      savedPrompts: updatedUser.savedPrompts,
    });
  } catch (error) {
    console.error("Error addPromptToSaved:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserData = async (req, res) => {
  console.log("i am in getUserData--- before try");
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("i am in getUserData");
    const user = await User.findById(req.user._id);
    res.status(200).json({ user });
  } catch (error) {
    console.log("i am in getUserData --- failed and the error is: ", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCryptoFromWallet = async (req, res) => {
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { rowData } = req.body;
    const cryptoID = rowData._id;

    console.log("row Data in backend is: ", rowData);
    console.log("crypto id is: ", cryptoID);

    if (!cryptoID) {
      return res.status(400).json({ message: "Crypto ID is required" });
    }

    // $pull to remove
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wallet: { _id: cryptoID } } },
      { new: true }
    );

    res.status(200).json({
      message: "Crypto removed from wallet",
      wallet: updatedUser.wallet,
    });
  } catch (error) {
    console.error("Error deleteCryptoFromWallet:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCryptoFromWatchlist = async (req, res) => {
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { rowData } = req.body;
    const cryptoID = rowData._id;

    if (!cryptoID) {
      return res.status(400).json({ message: "Crypto ID is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { watchlist: { _id: cryptoID } } },
      { new: true }
    );

    res.status(200).json({
      message: "Crypto removed from watchlist",
      watchlist: updatedUser.watchlist,
    });
  } catch (error) {
    console.error("Error in deleteCryptoFromWatchlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCryptoFromSaved = async (req, res) => {
  console.log("in deleteCryptoFromSaved");
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { rowData } = req.body;
    console.log("idk whawtever is passed in here: ", rowData);

    const promptID = rowData._id;
    console.log("prompt id is: ", promptID);

    if (!promptID) {
      return res.status(400).json({ message: "Prompt ID is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedPrompts: { _id: promptID } } },
      { new: true }
    );

    res.status(200).json({
      message: "Prompt removed from saved",
      savedPrompts: updatedUser.savedPrompts,
    });
  } catch (error) {
    console.error("Error in deleteCryptoFromSaved:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateCryptoAmountFromWallet = async (req, res) => {
  console.log("in updateCryptoAmountFromWallet");
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { rowData, newAmount } = req.body;
    const cryptoID = rowData._id;
    console.log("rowdata is: ", rowData);
    console.log("new amount is: ", newAmount);
    console.log("passed in crypto id is: ", cryptoID);
    console.log("passed in crypto id type is: ", typeof rowData._id);

    if (!cryptoID) {
      return res.status(400).json({ message: "Crypto ID is required" });
    }

    const objectId = new mongoose.Types.ObjectId(cryptoID);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "wallet.$[crypto].amount": newAmount } },
      {
        new: true,
        arrayFilters: [{ "crypto._id": objectId }],
      }
    );

    res.status(200).json({
      message: "Crypto updated from wallet",
      wallet: updatedUser.wallet,
    });
  } catch (error) {
    console.error("Error updateCryptoAmountFromWallet:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserInfo = async (req, res) => {
  console.log("in update user info backend");
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { firstName, lastName, pfp } = req.body;
    // also update the pfp? - it could be an added function ig? - but then it involves default image and stuff
    console.log("the name passed in here is: ", firstName, lastName);

    const updateUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { firstName, lastName, pfp } },
      { new: true }
    );

    res.status(200).json({
      message: "user info updated",
      wallet: updateUser.firstName,
    });
  } catch (error) {
    console.error("Error updateUserInfo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addCryptoToWallet,
  addCryptoToWatchlist,
  addPromptToSaved,
  getUserData,
  deleteCryptoFromWallet,
  deleteCryptoFromWatchlist,
  deleteCryptoFromSaved,
  updateCryptoAmountFromWallet,
  updateUserInfo,
};
