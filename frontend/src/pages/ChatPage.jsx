import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  createChat,
  getChatMessages,
  addPromptToSaved,
} from "../services/userAPI";
import { message } from "antd";
import ChatChart from "../components/ChatChart";
import promptList from "../components/PromptList";
import { Button, Card, Skeleton, BottomSheet } from "../ui/index";
import { cn } from "../utils/cn";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const location = useLocation();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const hasUserSentMessage = useRef(false);
  const inputRef = useRef(null);

  // Generate unique message ID
  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const getWelcomeMsg = () => [
    {
      id: 'welcome-msg',
      content:
        "👋 Hello! I'm **CryptoGPT**, your AI crypto assistant.\n\nI can help you with:\n• Real-time crypto prices and market data\n• Technical analysis and trends\n• Investment strategies and insights\n• News and market updates\n\nTry asking me: *'What's the current price of Bitcoin?'* or *'Show me the top trending cryptocurrencies'* 📈",
      role: "chatBot",
      isError: false,
      visualization: null,
      timestamp: new Date().toISOString(),
    },
  ];  const initialiseNewChat = async () => {
    try {
      const chatData = await createChat();
      return chatData.chat;
    } catch (error) {
      console.error("Error initializing new chat:", error);
      setError("Failed to initialize new chat");
      return null;
    }
  };

  // Icons
  const SendIcon = () => (
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
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );

  const BookmarkIcon = () => (
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
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );

  const SparklesIcon = () => (
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
        d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z"
      />
    </svg>
  );

  const MicIcon = () => (
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
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );

  // Initialize chat
  useEffect(() => {
    const loadChatMessages = async (chatId) => {
      try {
        setIsLoading(true);
        const chatData = await getChatMessages(chatId);

        if (chatData.messages && chatData.messages.length > 0) {
          // Ensure all messages have IDs for stable rendering
          const messagesWithIds = chatData.messages.map(msg => ({
            ...msg,
            id: msg.id || generateMessageId()
          }));
          setMessages(messagesWithIds);
          hasUserSentMessage.current = true;
        } else {
          setMessages(getWelcomeMsg());
        }
      } catch (error) {
        console.error("Error loading chat messages:", error);
        setMessages(getWelcomeMsg());
      } finally {
        setIsLoading(false);
      }
    };

    const initializeChat = async () => {
      if (chatId && chatId !== "new") {
        setCurrentChatId(chatId);
        await loadChatMessages(chatId);
      } else if (location.state?.justCreated) {
        // New chat was just created
        if (location.state.isNewChat) {
          setMessages(getWelcomeMsg());
        }
      } else {
        // Create new chat if none exists
        const newChat = await initialiseNewChat();
        if (newChat) {
          setCurrentChatId(newChat._id);
          setMessages(getWelcomeMsg());
          navigate(`/chat/${newChat._id}`, { replace: true });
        }
      }
    };

    initializeChat();
  }, [chatId, location.state, navigate]);

  const handleSendMessage = useCallback(async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      id: generateMessageId(),
      content: textToSend,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    hasUserSentMessage.current = true;

    try {
      const response = await fetch(`/api/chat/${currentChatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: textToSend }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const botMessageId = generateMessageId();
      let botMessage = {
        id: botMessageId,
        content: "",
        role: "chatBot",
        isError: false,
        visualization: null,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Throttle updates to reduce flickering during streaming
      let updateTimeout = null;
      const updateBotMessage = () => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.id === botMessageId) {
            updated[lastIndex] = { ...botMessage };
          }
          return updated;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Final update
          if (updateTimeout) clearTimeout(updateTimeout);
          updateBotMessage();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "content") {
                botMessage.content += data.content;
                // Throttle content updates to reduce flickering
                if (updateTimeout) clearTimeout(updateTimeout);
                updateTimeout = setTimeout(updateBotMessage, 50);
              } else if (data.type === "visualization") {
                botMessage.visualization = data.visualization;
                // Update immediately for visualization
                updateBotMessage();
              } else if (data.type === "complete") {
                // Handle the final complete message from backend
                botMessage.content = data.text || botMessage.content;
                if (updateTimeout) clearTimeout(updateTimeout);
                updateBotMessage();
              } else if (data.type === "start") {
                // Initial message from backend - no action needed
                console.log("LLM processing started");
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          content: "Sorry, I encountered an error. Please try again.",
          role: "chatBot",
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentChatId]);

  const handleSavePrompt = useCallback(async (content) => {
    try {
      await addPromptToSaved(content);
      message.success("Prompt saved successfully!");
    } catch (error) {
      console.error("Error saving prompt:", error);
      message.error("Failed to save prompt");
    }
  }, []);

  // Memoized input handlers to prevent re-renders
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Auto-scroll to bottom - optimized to reduce flickering
  const previousMessageCount = useRef(0);
  useEffect(() => {
    if (chatContainerRef.current && messages.length > previousMessageCount.current) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    }
    previousMessageCount.current = messages.length;
  }, [messages]);

  const MessageBubble = React.memo(({ message, onSavePrompt }) => {
    const isUser = message.role === "user";
    const isBot = message.role === "chatBot";

    return (
      <div
        className={cn(
          "flex w-full",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 md:px-5 md:py-4 break-words transition-all duration-200",
            isUser
              ? "bg-primary-600 hover:bg-primary-700 text-white ml-2 md:ml-4 shadow-lg"
              : "bg-white border border-neutral-200 mr-2 md:mr-4 shadow-md hover:shadow-lg"
          )}
        >
          {isBot && !message.isError && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <SparklesIcon />
                </div>
                <span className="text-sm font-medium text-neutral-600">
                  CryptoGPT
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSavePrompt(message.content)}
                className="h-6 w-6 p-0"
              >
                <BookmarkIcon />
              </Button>
            </div>
          )}

          <div
            className={cn(
              "prose prose-sm max-w-none",
              isUser ? "prose-invert" : "",
              message.isError ? "text-danger-600" : ""
            )}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {message.visualization && (
            <div className="mt-4 rounded-xl overflow-hidden">
              <ChatChart visualization={message.visualization} />
            </div>
          )}

          <div
            className={cn(
              "text-xs mt-2 opacity-70",
              isUser ? "text-right text-primary-100" : "text-neutral-500"
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  });

  MessageBubble.displayName = 'MessageBubble';

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-neutral-50 to-primary-50/20 z-10 pt-14 md:pt-16">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-neutral-200/50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors md:hidden"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="font-semibold text-neutral-900">CryptoGPT</h1>
              <p className="text-sm text-neutral-500">
                Your AI crypto assistant
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompts(true)}
              icon={<SparklesIcon />}
              className="hidden md:flex"
            >
              Prompts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompts(true)}
              className="md:hidden w-9 h-9 p-0"
            >
              <SparklesIcon />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6 min-h-0"
        style={{ scrollBehavior: "smooth" }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-start">
                <div className="max-w-[70%] space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id || message.timestamp} 
              message={message} 
              onSavePrompt={handleSavePrompt}
            />
          ))
        )}

        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[70%] bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <SparklesIcon />
                </div>
                <span className="text-sm font-medium text-neutral-600">
                  CryptoGPT
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/50 p-3 md:p-4 pb-20 md:pb-4 safe-area-bottom">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-2 md:space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about Crypto..."
                className="w-full min-h-[52px] max-h-32 px-5 py-4 pr-14 text-base border-2 border-neutral-200 rounded-2xl bg-white/90 backdrop-blur-sm placeholder-neutral-400 resize-none transition-all duration-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none hover:border-neutral-300"
                rows={1}
                style={{
                  height: "auto",
                  minHeight: "52px",
                }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "absolute bottom-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                  input.trim() && !isLoading
                    ? "bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg active:scale-95"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                )}
              >
                <SendIcon />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 md:mt-3 text-xs text-neutral-500">
            <span className="hidden md:inline">
              Press Enter to send, Shift + Enter for new line
            </span>
            <span className="md:hidden">Tap send or press Enter</span>
            <span>{input.length}/2000</span>
          </div>
        </div>
      </div>

      {/* Quick Prompts Bottom Sheet */}
      <BottomSheet
        isOpen={showPrompts}
        onClose={() => setShowPrompts(false)}
        title="Quick Start Prompts"
      >
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {promptList.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                handleSendMessage(prompt);
                setShowPrompts(false);
              }}
              className="w-full p-3 text-left bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors"
            >
              <p className="text-sm font-medium text-neutral-900">{prompt}</p>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default ChatPage;
