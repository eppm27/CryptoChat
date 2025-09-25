import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { message } from "antd";
import {
  updateCryptoAmount,
  deleteCryptoFromWallet,
  deleteCryptoFromWatchlist,
  deletePromptFromSaved,
} from "../services/userAPI";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import GraphColour from "./GraphColour";

const DeleteModal = ({ closeModal, rowData, modalType, onSuccess }) => {
  const [isEditable, setIsEditable] = useState(false);
  const [amount, setAmount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    setAmount(rowData.amount);
  }, [rowData]);

  const handleDeleteOrUpdate = () => {
    if (isEditable) {
      updateItem();
    } else {
      deleteItem();
    }
  };

  const updateItem = async () => {
    try {
      const successMessage = await updateCryptoAmount(rowData, amount);
      message.success(successMessage);
      onSuccess?.();
      closeModal();
    } catch (error) {
      console.error("Error:", error);
      message.error(error.message || "Failed to update crypto from wallet");
    }
  };

  const deleteItem = async () => {
    if (modalType === "watchlistPage") {
      try {
        const successMessage = await deleteCryptoFromWatchlist(
          rowData.userWatchlistInfo
        );
        message.success(successMessage);
        onSuccess?.();
        closeModal();
      } catch (error) {
        console.error("Error:", error);
        message.error(
          error.message || "Failed to delete crypto from watchlist"
        );
      }
    } else if (modalType === "savedPage") {
      try {
        const successMessage = await deletePromptFromSaved(rowData);
        message.success(successMessage);
        onSuccess?.();
        closeModal();
      } catch (error) {
        console.error("Error:", error);
        message.error(error.message || "Failed to delete prompt from saved");
      }
    } else if (modalType === "walletPage") {
      try {
        const successMessage = await deleteCryptoFromWallet(rowData);
        message.success(successMessage);
        onSuccess?.();
        closeModal();
      } catch (error) {
        console.error("Error:", error);
        message.error(error.message || "Failed to delete crypto from wallet");
      }
    }
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleEditClick = () => {
    setIsEditable(true);
  };

  const handleCryptoDetails = () => {
    navigate(
      modalType === "watchlistPage"
        ? `/cryptoDetails/${rowData.userWatchlistInfo.cryptoId}`
        : `/cryptoDetails/${rowData.cryptoId}`
    );
  };

  const handleChat = async () => {
    let inputPrompt;

    if (modalType === "watchlistPage") {
      inputPrompt = `Tell me about watchlist crypto ${rowData.name}`;
    } else if (modalType === "walletPage") {
      inputPrompt = `Tell me about wallet crypto ${rowData.name}`;
    } else if (modalType === "savedPage") {
      inputPrompt = rowData.prompt;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content: inputPrompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to create a new chat with the prompt");
      }

      const data = await response.json();

      if (!data.chat || !data.chat._id) {
        throw new Error("Invalid response structure: Missing chat._id");
      }

      navigate(`/chat/${data.chat._id}`, {
        state: {
          initialPrompt: inputPrompt,
          isNewChat: true,
          existingMessages: [
            {
              text: inputPrompt,
              sender: "user",
              isError: false,
            },
            {
              text: data.llmMessage?.content || "No response received.",
              sender: "chatBot",
              isError: data.llmMessage?.isError || false,
            },
          ],
        },
      });
    } catch (err) {
      console.error("Error handling insights button:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-300 max-w-2xl w-full p-6 relative">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Details</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-700 mb-6">
          {rowData?.name || rowData.prompt}
        </h3>

        {/* Watchlist Details */}
        {modalType === "watchlistPage" && (
          <div className="flex flex-col gap-3 text-sm text-gray-700 mb-4 text-left ml-6">
            {/* Show wallet details */}
            <p>
              <span className="font-semibold">Symbol:</span>{" "}
              {rowData.userWatchlistInfo.cryptoSymbol.toUpperCase()}
            </p>

            <p>
              <span className="font-semibold">Price:</span> {rowData.price}
            </p>

            <div>
              <p className="font-semibold mb-1">Changes:</p>
              <div className="ml-4 space-y-1">
                {["change1h", "change24h", "change7d"].map((term) => {
                  const changeValue = parseFloat(
                    rowData[term].replace("%", "")
                  );
                  const changeColor =
                    changeValue >= 0 ? "text-green-600" : "text-red-600";
                  const label =
                    term === "change1h"
                      ? "1h"
                      : term === "change24h"
                      ? "24h"
                      : "7d";
                  return (
                    <p key={term}>
                      <span className="font-medium">{label}:</span>{" "}
                      <span className={changeColor}>{rowData[term]}</span>
                    </p>
                  );
                })}
              </div>
            </div>

            <p>
              <span className="font-semibold">Market Cap:</span>{" "}
              {rowData.marketCap}
            </p>

            <div className="mt-2">
              <p className="font-semibold mb-1">Last 7 Days:</p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={rowData.graphInfo}>
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={GraphColour(rowData.graphInfo)}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Wallet Amount Input */}
        {modalType === "walletPage" && (
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Amount:
              </label>
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                disabled={!isEditable}
                className="p-2 border border-gray-300 rounded-md w-32"
              />
              {!isEditable && (
                <button
                  onClick={handleEditClick}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between gap-3 mt-6">
          <button
            onClick={handleDeleteOrUpdate}
            className={`px-4 py-2 rounded-md text-white transition ${
              isEditable
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isEditable ? "Update" : "Delete"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleChat}
              className="px-4 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition"
            >
              AI Insights
            </button>

            {modalType !== "savedPage" && (
              <button
                onClick={handleCryptoDetails}
                className="px-4 py-2 rounded-md bg-green-400 hover:bg-yellow-500 text-gray-900 transition"
              >
                Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;

DeleteModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  rowData: PropTypes.object.isRequired,
  modalType: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
