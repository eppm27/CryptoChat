import React from "react";
import PropTypes from "prop-types";
import { message } from "antd";
import { deleteChat } from "../services/userAPI";

const DeleteChatModal = ({ closeModal, chatId, onSuccess }) => {
  const handleDelete = async () => {
    try {
      await deleteChat(chatId);
      message.success("Chat deleted successfully");
      onSuccess?.();
      closeModal();
    } catch (error) {
      console.error("Error deleting chat:", error);
      message.error("Failed to delete chat.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-300 max-w-md w-full p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Delete Chat</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-700 text-md mb-6">
          Are you sure you want to delete this chat?
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteChatModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  chatId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default DeleteChatModal;
