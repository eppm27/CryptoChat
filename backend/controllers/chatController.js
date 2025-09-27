const { Chat, Message } = require("../dbSchema/chatSchema");
const llmService = require("../services/llmService");
const User = require("../dbSchema/userSchema");
const graphService = require("../services/graphService");
const { generateChatTitle } = require("../services/llmService");

// New chat
const createChat = async (req, res) => {
  try {
    if (!req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { content } = req.body;

    const trimmedTitle = content
      ? content.length > 50
        ? content.slice(0, 50).trim() + "..."
        : content.trim()
      : "Untitled Chat";

    // Include lastMessage on creation
    const chat = new Chat({
      user: req.user._id,
      title: trimmedTitle,
      lastMessage: content || "New chat started",
    });

    await chat.save();

    res.status(201).json({
      chat,
    });
  } catch (error) {
    console.error("Error in createChat:", error);
    res.status(500).json({ error: error.message });
  }
};

// Add message with streaming support
const addMessage = async (req, res) => {
  try {
    // Verify conversation ownership
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      user: req.user._id,
    });

    if (!chat) {
      return res
        .status(404)
        .json({ error: "chat not found or not authorized" });
    }

    const { content } = req.body;

    // Set up SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Save user message
    const userMessage = new Message({
      chat: req.params.chatId,
      role: "user",
      content,
    });

    await userMessage.save();

    // Send confirmation that user message was saved
    res.write(
      `data: ${JSON.stringify({
        type: "start",
        userMessage: userMessage.toObject(),
      })}\n\n`
    );

    // Get user's wallet for context
    const user = await User.findById(req.user._id);

    // Create stream callback for LLM
    let streamContent = "";
    const streamHandler = (chunk) => {
      if (chunk.content) {
        streamContent += chunk.content;

        // Filter out graph-data blocks from streaming content
        const filteredContent = chunk.content.replace(
          /```graph-data\n[\s\S]*?\n```/g,
          ""
        );

        if (filteredContent.trim()) {
          res.write(
            `data: ${JSON.stringify({
              ...chunk,
              content: filteredContent,
            })}\n\n`
          );
        }
      }
    };

    // Process query with streaming
    const llmResponse = await llmService.processQuery(
      content,
      user.wallet,
      streamHandler
    );

    // Process visualizations after streaming is complete
    const processedResponse = await graphService.processGraphsInResponse(
      llmResponse,
      user.wallet
    );

    console.log("🔍 Debug processed response:");
    console.log(
      "- LLM Response visualizations:",
      llmResponse?.visualizations?.length || 0
    );
    console.log(
      "- Processed Response visualizations:",
      processedResponse?.visualizations?.length || 0
    );
    if (processedResponse?.visualizations?.length > 0) {
      console.log(
        "- First visualization:",
        JSON.stringify(processedResponse.visualizations[0], null, 2)
      );
    }

    // Generate title if this is the first user message
    const messageCount = await Message.countDocuments({
      chat: req.params.chatId,
    });

    if (messageCount === 1) {
      // First user message
      const title = await generateChatTitle(content);
      await Chat.findByIdAndUpdate(req.params.chatId, {
        title,
        lastMessage: content,
        updatedAt: Date.now(),
      });
    } else {
      // Update last message only
      await Chat.findByIdAndUpdate(req.params.chatId, {
        lastMessage: content,
        updatedAt: Date.now(),
      });
    }

    // Safely extract content as a string
    let safeContent = "";
    if (
      processedResponse &&
      typeof processedResponse.text === "string" &&
      processedResponse.text.trim() !== ""
    ) {
      safeContent = processedResponse.text;
    } else if (typeof llmResponse === "string") {
      safeContent = llmResponse;
    } else if (llmResponse && typeof llmResponse.text === "string") {
      safeContent = llmResponse.text;
    } else if (streamContent.trim() !== "") {
      // Use accumulated stream content if nothing else is available
      safeContent = streamContent;
    } else {
      safeContent = JSON.stringify(processedResponse || llmResponse || "");
    }

    // Safely handle visualizations
    const visualization = Array.isArray(processedResponse.visualizations)
      ? processedResponse.visualizations
      : [];

    // If there was no text but there is a graph, use the graph titles to satisfy the required content
    if (safeContent.trim() === "" && visualization.length > 0) {
      safeContent = visualization
        .map((v) => v.title || "Visualization")
        .join(", ");
    }

    // Create the LLM message with guaranteed string content
    const llmMessage = await Message.create({
      chat: req.params.chatId,
      role: "chatBot",
      content: safeContent,
      visualization: visualization.length > 0 ? visualization : null,
      isVisualization: visualization.length > 0,
    });

    // update chat with last message
    chat.lastMessage = content;
    chat.updatedAt = Date.now();
    await chat.save();

    // Send visualization event first if we have visualizations
    if (visualization.length > 0) {
      console.log("📊 Sending visualization event:", visualization[0]);
      res.write(
        `data: ${JSON.stringify({
          type: "visualization",
          visualization: visualization[0],
        })}\n\n`
      );
    } else {
      console.log("❌ No visualizations to send");
    }

    // Send final completion event with all metadata
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        llmMessage: {
          ...llmMessage.toObject(),
          text: llmMessage.content,
        },
      })}\n\n`
    );

    // End the response stream
    res.end();
  } catch (error) {
    console.error("Error in addMessage:", error);

    // Try to send error as SSE event if headers were already sent
    try {
      if (!res.headersSent) {
        // Set up SSE headers if not already done
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
      }

      // Send error as event
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: error.message || "An error occurred",
        })}\n\n`
      );

      // Save error message to database
      if (req.params.chatId) {
        await Message.create({
          chat: req.params.chatId,
          role: "chatBot",
          content: "Sorry, I encountered an error processing your request.",
          isError: true,
        });
      }

      res.end();
    } catch (e) {
      console.error("Error handling streaming error:", e);
      // If we can't send as SSE, try normal error response
      if (!res.headersSent) {
        res.status(500).json({
          error: error.message,
          message: "issue with addMessage",
        });
      }
    }
  }
};

// Add this function to handle streaming GET requests
const streamMessage = async (req, res) => {
  try {
    // Verify conversation ownership
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      user: req.user._id,
    });

    if (!chat) {
      return res
        .status(404)
        .json({ error: "chat not found or not authorized" });
    }

    // Get content from query parameter for GET requests
    const { content } = req.query;

    if (!content) {
      return res.status(400).json({ error: "No content provided in query" });
    }

    // Set up SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Important for Nginx proxying
    });

    // Save user message
    const userMessage = new Message({
      chat: req.params.chatId,
      role: "user",
      content,
    });

    await userMessage.save();

    // Send confirmation that user message was saved
    res.write(
      `data: ${JSON.stringify({
        type: "start",
        userMessage: userMessage.toObject(),
      })}\n\n`
    );

    // Get user's wallet for context
    const user = await User.findById(req.user._id);

    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      try {
        res.write(`:ping\n\n`);
      } catch (e) {
        console.error("Error sending ping:", e);
        clearInterval(pingInterval);
      }
    }, 30000); // Send ping every 30 seconds

    // Create stream callback for LLM
    let streamContent = "";
    const streamHandler = (chunk) => {
      if (chunk.content) {
        streamContent += chunk.content;
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    };

    // Process query with streaming
    const llmResponse = await llmService.processQuery(
      content,
      user.wallet,
      streamHandler
    );

    // Clear the ping interval
    clearInterval(pingInterval);

    // Process visualizations after streaming is complete
    const processedResponse = await graphService.processGraphsInResponse(
      llmResponse,
      user.wallet
    );

    // Generate title if this is the first user message
    const messageCount = await Message.countDocuments({
      chat: req.params.chatId,
    });

    if (messageCount <= 2) {
      // First or second message (first user message + first LLM response)
      const title = await generateChatTitle(content);
      await Chat.findByIdAndUpdate(req.params.chatId, {
        title,
        lastMessage: content,
        updatedAt: Date.now(),
      });
    } else {
      // Update last message only
      await Chat.findByIdAndUpdate(req.params.chatId, {
        lastMessage: content,
        updatedAt: Date.now(),
      });
    }

    // Safely extract content as a string
    let safeContent = "";
    if (
      processedResponse &&
      typeof processedResponse.text === "string" &&
      processedResponse.text.trim() !== ""
    ) {
      safeContent = processedResponse.text;
    } else if (typeof llmResponse === "string") {
      safeContent = llmResponse;
    } else if (llmResponse && typeof llmResponse.text === "string") {
      safeContent = llmResponse.text;
    } else if (streamContent.trim() !== "") {
      // Use accumulated stream content if nothing else is available
      safeContent = streamContent;
    } else {
      safeContent = JSON.stringify(processedResponse || llmResponse || "");
    }

    // Safely handle visualizations
    const visualization = Array.isArray(processedResponse.visualizations)
      ? processedResponse.visualizations
      : [];

    // If there was no text but there is a graph, use the graph titles to satisfy the required content
    if (safeContent.trim() === "" && visualization.length > 0) {
      safeContent = visualization
        .map((v) => v.title || "Visualization")
        .join(", ");
    }

    // Create the LLM message with guaranteed string content
    const llmMessage = await Message.create({
      chat: req.params.chatId,
      role: "chatBot",
      content: safeContent,
      visualization: visualization.length > 0 ? visualization : null,
      isVisualization: visualization.length > 0,
    });

    // update chat with last message
    chat.lastMessage = content;
    chat.updatedAt = Date.now();
    await chat.save();

    // Send final completion event with all metadata
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        llmMessage: {
          ...llmMessage.toObject(),
          text: llmMessage.content,
        },
      })}\n\n`
    );

    // End the response stream
    res.end();
  } catch (error) {
    console.error("Error in streamMessage:", error);

    // Try to send error as SSE event if headers were already sent
    try {
      if (!res.headersSent) {
        // Set up SSE headers if not already done
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
      }

      // Send error as event
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: error.message || "An error occurred",
        })}\n\n`
      );

      // Save error message to database
      if (req.params.chatId) {
        await Message.create({
          chat: req.params.chatId,
          role: "chatBot",
          content: "Sorry, I encountered an error processing your request.",
          isError: true,
        });
      }

      res.end();
    } catch (e) {
      console.error("Error handling streaming error:", e);
      // If we can't send as SSE, try normal error response
      if (!res.headersSent) {
        res.status(500).json({
          error: error.message,
          message: "issue with streamMessage",
        });
      }
    }
  }
};

// Deleting chat (clearing chat)
const deleteChat = async (req, res) => {
  try {
    // Verify chat belongs to user
    const chat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      user: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Delete all associated messages with that chat
    await Message.deleteMany({ chat: req.params.chatId });

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message + "issue with deleteChat" });
  }
};

// Get all chats
const getAllChats = async (req, res) => {
  try {
    console.log("Getting chats for user:", req.user);

    if (!req.user || !req.user._id) {
      return res.status(400).json({ error: "User ID not found in request" });
    }

    const chats = await Chat.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select("title lastMessage updatedAt");

    console.log("found cahts:", chats.length);
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message + "issue with getAllChats" });
  }
};

// Get all messages for a specific chat
const getMessages = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      user: req.user._id,
    });

    if (!chat) {
      return res
        .status(404)
        .json({ error: "Chat not found or not authorized" });
    }

    const messages = await Message.find({ chat: chat._id }).sort({
      createdAt: 1,
    });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createChat,
  addMessage,
  deleteChat,
  getAllChats,
  getMessages,
  streamMessage,
};
