import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import ReactMarkdown from "react-markdown";
import sendIcon from "../assets/plain-svgrepo-com.svg";
import { useLocation, useParams } from "react-router-dom";
import {
  createChat,
  getChatMessages,
  deleteChat,
  addPromptToSaved,
} from "../services/userAPI";
import { message } from "antd";
import ChatChart from "../components/ChatChart";
import promptList from "../components/PromptList";
import { Skeleton } from "@mui/material";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const { chatId } = useParams();
  const hasUserSentMessage = useRef(false);
  const inputRef = useRef(null);

  const getWelcomeMsg = () => [
    {
      content:
        "Hello! I'm your crypto assistant. Ask me something like: 'What's the current price of Bitcoin?' 📈",
      role: "chatBot",
      isError: false,
      visualization: null,
    },
  ];

  const initialiseNewChat = async () => {
    try {
      const chatData = await createChat();
      return chatData.chat;
    } catch (error) {
      console.error("Error initializing new chat:", error);
      setError("Failed to initialize new chat");
      return null;
    }
  };

  const randomizedPrompts = useMemo(() => {
    return promptList.sort(() => 0.5 - Math.random()).slice(0, 3);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!chatId && !currentChatId) {
        const newChat = await initialiseNewChat();
        setCurrentChatId(newChat._id);
        setMessages(getWelcomeMsg());
      } else if (chatId && !currentChatId) {
        setCurrentChatId(chatId);
      }
    };
    init();
  }, [chatId, currentChatId, location.state?.isNewChat]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChatId) return;
      if (messages.length > 0) return;
      try {
        const { messages: messagesData } = await getChatMessages(currentChatId);
        if (!messagesData || messagesData.length === 0) {
          setMessages((prev) => (prev.length === 0 ? getWelcomeMsg() : prev));
        } else {
          setMessages(
            messagesData.map((msg) => ({
              content: msg.content,
              role: msg.role === "user" ? "user" : "chatBot",
              isError: msg.isError,
              visualizations: msg.visualization || null,
              createdAt: msg.createdAt,
            }))
          );
        }
      } catch (err) {
        console.error("Chat init failed:", err);
        setError("Failed to load chat");
      }
    };
    fetchMessages();
  }, [currentChatId, location.state?.isNewChat, messages, messages.length]);

  const handleSend = useCallback(
    async (customPrompt) => {
      hasUserSentMessage.current = true;
      const messageToSend =
        typeof customPrompt === "string" ? customPrompt.trim() : input.trim();
      if (!messageToSend || !currentChatId) return;

      setIsLoading(true);
      setInput("");
      setError(null);

      const placeholderId = Date.now().toString();

      setMessages((prev) => [
        ...prev,
        {
          content: messageToSend,
          role: "user",
          isError: false,
          visualization: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: placeholderId,
          content: "",
          role: "chatBot",
          isError: false,
          isStreaming: true,
          visualizations: null,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const eventSource = new EventSource(
          `/api/chat/${currentChatId}/messages/stream?content=${encodeURIComponent(
            messageToSend
          )}`
        );

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === "content") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholderId
                  ? {
                      ...msg,
                      content: (msg.content || "") + (data.content || ""),
                    }
                  : msg
              )
            );
          } else if (data.type === "chart") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholderId
                  ? {
                      ...msg,
                      visualizations: [
                        ...(msg.visualizations || []),
                        data.spec,
                      ],
                    }
                  : msg
              )
            );
          } else if (data.type === "complete") {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.findLastIndex(
                (msg) => msg.role === "chatBot"
              );
              if (lastIndex !== -1) {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  id: data.llmMessage?._id ?? updated[lastIndex].id,
                  isStreaming: false,
                  content:
                    data.llmMessage?.content || data.llmMessage?.text || "",
                  visualizations: data.llmMessage?.visualization || null,
                  isError: data.llmMessage?.isError || false,
                };
              }
              return updated;
            });
            eventSource.close();
            setIsLoading(false);
            setTimeout(async () => {
              try {
                const { messages: updatedMessages } = await getChatMessages(
                  currentChatId
                );
                setMessages(
                  updatedMessages.map((msg) => ({
                    content: msg.content,
                    role: msg.role === "user" ? "user" : "chatBot",
                    isError: msg.isError,
                    visualizations: msg.visualization || null,
                    createdAt: msg.createdAt,
                  }))
                );
              } catch (err) {
                console.error("Failed to refetch messages:", err);
              }
            }, 500);
          } else if (data.type === "error") {
            setError(data.error);
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.findLastIndex(
                (msg) => msg.role === "chatBot"
              );

              if (lastIndex !== -1) {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  id: data.llmMessage?._id ?? updated[lastIndex].id,
                  isStreaming: false,
                  content:
                    data.llmMessage?.content || data.llmMessage?.text || "",
                  visualizations: data.llmMessage?.visualization || null,
                  isError: data.llmMessage?.isError || false,
                };
              }

              return updated;
            });

            eventSource.close();
            setIsLoading(false);
          }
        };

        eventSource.onerror = (error) => {
          console.error("EventSource error:", error);
          setError("Connection error occurred");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholderId
                ? {
                    ...msg,
                    content: "Connection error occurred",
                    isError: true,
                    isStreaming: false,
                  }
                : msg
            )
          );
          eventSource.close();
          setIsLoading(false);
        };
      } catch (error) {
        console.error("Error setting up streaming:", error);
        setMessages((prev) => [
          ...prev,
          {
            content: "Failed to get response",
            role: "chatBot",
            isError: true,
            visualization: null,
            createdAt: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
      }
    },
    [input, currentChatId]
  );

  //automatic scroll up
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (!hasUserSentMessage.current && currentChatId) {
        deleteChat(currentChatId)
          .then(() => console.log("Empty chat deleted"))
          .catch((err) => console.error("Failed to delete empty chat:", err));
      }
    };
  }, [currentChatId]);

  // downloads the latest chat response
  const handleDownload = () => {
    const lastBotMessage = [...messages]
      .reverse()
      .find((m) => m.role === "chatBot");
    if (!lastBotMessage) return;

    const blob = new Blob([lastBotMessage.content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "chat-response.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReport = () => {
    const lastBotMessage = [...messages]
      .reverse()
      .find((m) => m.role === "chatBot");
    if (!lastBotMessage) return;

    const subject = encodeURIComponent("Report: Inappropriate Bot Response");
    const body = encodeURIComponent(
      `I want to report the following bot response:\n\n"${
        lastBotMessage.content
      }"\n\nChat ID: ${currentChatId || "N/A"}`
    );
    window.location.href = `mailto:cryptochat.it@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleSavePrompt = async () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMessage) {
      message.warning("No user message found to save.");
      return;
    }

    try {
      await addPromptToSaved(lastUserMessage.content);
      message.success("Prompt saved to your Saved Prompts!");
    } catch (error) {
      console.error("Error saving prompt:", error);
      message.error("Failed to save the prompt.");
    }
  };

  //clear chat
  const handleClearChat = async () => {
    if (!currentChatId) return;
    try {
      await deleteChat(currentChatId);
      setMessages([]);
      const chatData = await initialiseNewChat();
      setCurrentChatId(chatData._id);
      setMessages(getWelcomeMsg());
    } catch (err) {
      console.error("Failed to delete chat:", err);
      setError("Failed to delete chat");
    }
  };

  const hasSentPromptRef = useRef(false);

  useEffect(() => {
    const safeSend = () => {
      if (
        !hasSentPromptRef.current &&
        currentChatId &&
        location.state?.isNewChat
      ) {
        const prompt =
          location.state?.initialPrompt ||
          location.state?.dashboardPrompt ||
          location.state?.walletWatchlistPrompt;
        if (prompt) {
          hasSentPromptRef.current = true;
          handleSend(prompt);
        }
      }
    };
    safeSend();
  }, [
    currentChatId,
    location.state?.isNewChat,
    location.state?.initialPrompt,
    location.state?.dashboardPrompt,
    location.state?.walletWatchlistPrompt,
    handleSend,
  ]);

  return (
    <div className="flex flex-col h-screen">
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Chat Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-grow p-4 space-y-4 overflow-y-auto pb-[225px]"
      >
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div
              key={`${index}-${message.createdAt}`}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 max-w-[90%] text-base rounded-2xl shadow-md ${
                  message.role === "user"
                    ? "bg-[#2563eb] text-white rounded-br-sm self-end"
                    : message.isError
                    ? "bg-red-100 text-red-900 rounded-bl-sm self-start"
                    : message.isStreaming
                    ? "bg-gray-100 text-gray-900 rounded-bl-sm self-start border-l-4 animate-pulse"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm self-start"
                } text-left`}
              >
                <ReactMarkdown>{message.content || message.text}</ReactMarkdown>
                {message.visualizations && (
                  <div className="mt-2">
                    {Array.isArray(message.visualizations) ? (
                      message.visualizations.map((vis, idx) => (
                        <ChatChart key={`vis-${idx}`} visualization={vis} />
                      ))
                    ) : (
                      <ChatChart visualization={message.visualizations} />
                    )}
                  </div>
                )}
              </div>

              {message.isStreaming && (
                <span className="inline-block ml-1 animate-pulse">▌</span>
              )}
            </div>
          ))
        ) : (
          <>
            {[...Array(3)].map((_, idx) => (
              <Skeleton
                key={idx}
                variant="rectangular"
                height={60}
                width="70%"
                animation="wave"
                sx={{ borderRadius: 2 }}
              />
            ))}
          </>
        )}

        {/* Show Quick Start Prompts after welcome message */}
        {location.state?.isNewChat &&
          location.state?.justCreated &&
          messages.length === 1 &&
          messages[0].role === "chatBot" && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {randomizedPrompts.map((prompt, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="bg-blue-300 hover:bg-blue-400 rounded-2xl px-4 py-2 text-sm font-semibold cursor-pointer transition"
                >
                  {prompt}
                </div>
              ))}
            </div>
          )}
        {/* Icons below the bot's message bubble */}
        {messages.length > 0 &&
        messages[messages.length - 1].role === "chatBot" ? (
          <div className="flex flex-row justify-center mt-2 space-x-6">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-1 hover:scale-105 transition mb-2"
              aria-label="Download bot response"
            >
              <div className="p-3 bg-customNavyBlue hover:bg-[#1e3a8a] rounded-full shadow-md transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#ffffff"
                >
                  <path d="M480-315.33 284.67-510.67l47.33-48L446.67-444v-356h66.66v356L628-558.67l47.33 48L480-315.33ZM226.67-160q-27 0-46.84-19.83Q160-199.67 160-226.67V-362h66.67v135.33h506.66V-362H800v135.33q0 27-19.83 46.84Q760.33-160 733.33-160H226.67Z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-800">
                Download
              </span>
            </button>

            {/* Save Prompt Button */}
            <button
              onClick={handleSavePrompt}
              className="flex flex-col items-center gap-1 hover:scale-105 transition mb-2"
              aria-label="Save prompt"
            >
              <div className="p-3 bg-green-600 hover:bg-green-700 rounded-full shadow-md transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 -960 960 960"
                  width="24"
                  fill="#ffffff"
                >
                  <path d="M200-120v-656.67q0-27 19.83-46.83 19.84-19.83 46.84-19.83h426.66q27 0 46.84 19.83Q760-803.67 760-776.67V-120L480-240 200-120Zm66.67-101.33L480-312l213.33 90.67v-555.34H266.67v555.34Zm0-555.34h426.66-426.66Z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-800">
                Save Prompt
              </span>
            </button>

            {/* Report Button */}
            <button
              onClick={handleReport}
              className="flex flex-col items-center gap-1 hover:scale-105 transition mb-2"
              aria-label="Report bot message"
            >
              <div className="p-3 bg-red-500 hover:bg-red-600 rounded-full shadow-md transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#ffffff"
                >
                  <path d="M480-280.67q15 0 25.83-10.83 10.84-10.83 10.84-25.83 0-15-10.84-25.84Q495-354 480-354q-15 0-25.83 10.83-10.84 10.84-10.84 25.84t10.84 25.83Q465-280.67 480-280.67ZM446.67-430h66.66v-255.33h-66.66V-430Z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-800">Report</span>
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-row justify-center mt-2 space-x-6">
            {/* Skeleton for Loading State */}
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <Skeleton variant="circular" width={48} height={48} />
                <Skeleton variant="text" width={60} height={20} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer with Chat Input Field */}
      <footer className="fixed bottom-0 left-0 right-0 w-full bg-[#F1F5F9] border-t border-customNavyBlue shadow-md px-4 py-3">
        <div className="flex flex-col items-center max-w-3xl mx-auto gap-2">
          <div className="flex items-center w-full gap-3">
            {/* Input Field */}
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading && currentChatId) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-grow px-4 py-3 text-base rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-customNavyBlue shadow-sm placeholder-gray-500 resize-none overflow-hidden"
              disabled={isLoading || !currentChatId}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || !currentChatId}
              className="bg-customNavyBlue hover:bg-[#1e3a8a] active:bg-[#162d6a] transition p-3 rounded-full shadow-md"
            >
              <img src={sendIcon} alt="Send" className="w-5 h-5 invert" />
            </button>
          </div>

          <div className="flex justify-between items-center w-full text-sm text-gray-600">
            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              className="absolute bottom-[calc(15%+95px)] px-4 py-2 text-sm font-semibold text-white bg-red-500 shadow-md hover:bg-red-600 active:bg-red-700 transition rounded-t-lg"
            >
              Clear Chat
            </button>
            {/* Disclaimer */}
            <span className="italic text-xs">
              *Disclaimer: This assistant provides general information, not
              financial advice. Please verify independently.*
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
