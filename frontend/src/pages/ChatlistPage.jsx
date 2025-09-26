import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllChats, getChatMessages, createChat } from "../services/userAPI";
import DeleteChatModal from "../components/DeleteChatModal";
import { Button, Card, Skeleton, GlassCard } from "../ui/index";

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

  // Icons
  const PlusIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  );

  const ChatIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );

  const TrashIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );

  const ClockIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  useEffect(() => {
    document.title = "Chats - CryptoChat";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-primary-50/20">
      <div className="container-mobile py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">Your Chats</h1>
          <p className="text-neutral-600">Continue your crypto conversations</p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-danger-200 bg-danger-50">
            <div className="p-4 flex items-center space-x-3">
              <div className="w-5 h-5 text-danger-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-danger-700 font-medium">{error}</p>
            </div>
          </Card>
        )}

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          size="lg"
          className="w-full"
          icon={<PlusIcon />}
        >
          Start New Chat
        </Button>

        {/* Chat List */}
        <div className="space-y-4">
          {chats ? (
            chats.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      No chats yet
                    </h3>
                    <p className="text-neutral-600">
                      Start your first conversation with CryptoGPT!
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              chats.map((chat) => (
                <Card
                  key={chat._id}
                  hover
                  className="cursor-pointer group"
                  onClick={() => handleChatClick(chat._id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900 truncate">
                            {chat.title || "Untitled Chat"}
                          </h3>
                        </div>

                        <p className="text-neutral-600 line-clamp-2 mb-3">
                          {chat.lastMessage || "No messages yet"}
                        </p>

                        <div className="flex items-center text-sm text-neutral-500">
                          <ClockIcon />
                          <span className="ml-1">
                            {chat.updatedAt
                              ? new Date(chat.updatedAt).toLocaleDateString(
                                  [],
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "Unknown"}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatToDelete(chat);
                          setShowDeleteModal(true);
                        }}
                        className="opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-danger-600 w-9 h-9 p-0"
                        title="Delete Chat"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )
          ) : (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
