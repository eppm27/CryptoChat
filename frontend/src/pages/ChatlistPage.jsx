import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllChats, getChatMessages, createChat } from "../services/userAPI";
import DeleteChatModal from "../components/DeleteChatModal";
import { Skeleton } from "@mui/material";

const ChatListPage = () => {
  const [chats, setChats] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const navigate = useNavigate();

  // Fetch all chats on component mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await getAllChats();
        setChats(data);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to load chats. Please try again later.");
      }
    };

    fetchChats();
  }, [navigate]);

  // Handle starting a new chat
  const handleNewChat = async () => {
    try {
      const data = await createChat("");
      navigate(`/chat/${data.chat._id}`, {
        state: { isNewChat: true, justCreated: true },
      });
    } catch (err) {
      console.error("Error creating new chat:", err);
      setError("Failed to create a new chat. Please try again.");
    }
  };

  // Handle navigating to an existing chat
  const handleChatClick = async (chatId) => {
    try {
      const { messages } = await getChatMessages(chatId);
      const formattedMessages = messages.map((m) => ({
        text: m.content,
        sender: m.role === "user" ? "user" : "chatBot",
        isError: m.isError,
      }));

      navigate(`/chat/${chatId}`, {
        state: { existingMessages: formattedMessages },
      });
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load chat history.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-3xl p-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full p-3 mb-4 bg-blue-500 text-white font-bold rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          + Start New Chat
        </button>

        {/* Chat List */}
        <div className="bg-white rounded-lg shadow-md">
          {chats ? (
            chats.length === 0 ? (
              <p className="p-4 text-gray-600">
                No chats available. Start a new chat!
              </p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  className="p-4 border-b last:border-b-0 flex justify-between items-start hover:bg-gray-100 transition"
                >
                  <div
                    className="cursor-pointer flex-grow"
                    onClick={() => handleChatClick(chat._id)}
                  >
                    <h2 className="text-lg font-semibold">
                      {chat.title || "Untitled Chat"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Last updated:{" "}
                      {chat.updatedAt
                        ? new Date(chat.updatedAt).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatToDelete(chat);
                      setShowDeleteModal(true);
                    }}
                    className="ml-2 text-red-500 hover:text-red-700 transition"
                    title="Delete Chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash2-icon lucide-trash-2"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </button>
                </div>
              ))
            )
          ) : (
            <>
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="p-4 border-b last:border-b-0 flex flex-col gap-2"
                >
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="80%" height={18} />
                  <Skeleton variant="text" width="40%" height={14} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* Delete Modal */}
        {showDeleteModal && chatToDelete && (
          <DeleteChatModal
            chatId={chatToDelete._id}
            closeModal={() => {
              setShowDeleteModal(false);
              setChatToDelete(null);
            }}
            onSuccess={() => {
              setChats((prev) =>
                prev.filter((c) => c._id !== chatToDelete._id)
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ChatListPage;
