import React, { useState } from "react";
import PropTypes from "prop-types";
import { message } from "antd";
import { deleteChat } from "../services/userAPI";
import { Button, Card } from "./ui";
import { Trash2, X } from "lucide-react";

const DeleteChatModal = ({ closeModal, chatId, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteChat(chatId);
      message.success("Chat deleted successfully");
      onSuccess?.();
      closeModal();
    } catch (error) {
      console.error("Error deleting chat:", error);
      message.error(error.message || "Failed to delete chat");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-neutral-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase text-danger-600 font-semibold">
              Delete Chat
            </p>
            <h2 className="text-2xl font-semibold text-neutral-900">
              Remove conversation?
            </h2>
            <p className="text-sm text-neutral-500">
              This action will permanently delete the selected chat history. You
              won&apos;t be able to recover the messages once removed.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeModal}
            className="h-9 w-9 p-0 text-neutral-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete Chat
          </Button>
        </div>
      </Card>
    </div>
  );
};

DeleteChatModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  chatId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default DeleteChatModal;
