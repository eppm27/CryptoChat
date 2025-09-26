const llmService = require("../services/llmService");
const User = require("../dbSchema/userSchema");
const graphService = require("../services/graphService");

exports.askLLM = async (req, res) => {
  try {
    req.on("close", () => {
      console.log("Client closed connection");
    });
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "No query given" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set up SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send initial message
    res.write(`data: ${JSON.stringify({ type: "start" })}\n\n`);

    // Create stream callback
    const streamHandler = (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    };

    const llmresponse = await llmService.processQuery(
      query,
      user.wallet,
      streamHandler
    );

    const processedResponse = await graphService.processGraphsInResponse(
      llmresponse,
      user.wallet
    );

    // Send the final message with visualizations
    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        text: processedResponse.text,
        visualizations: processedResponse.visualizations,
      })}\n\n`
    );

    console.log(
      "→ processedResponse:",
      JSON.stringify(processedResponse, null, 2)
    );
    res.end();
  } catch (e) {
    console.error("Error in askLLM: ", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "internal service err " });
    } else {
      try {
        res.write(
          `data: ${JSON.stringify({ type: "error", error: e.message })}\n\n`
        );
        res.end();
      } catch (finalErr) {
        console.error("Error sending SSE response: ", finalErr);
      }
    }
    res.status(500).json({ error: "internal service err " });
  }
};

exports.chatLLM = async (req, res) => {
  try {
    req.on("close", () => {
      console.log("Client closed connection");
    });

    const { message } = req.body;
    const { chatId } = req.params;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set up SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Credentials": "true",
    });

    // Send initial message
    res.write(`data: ${JSON.stringify({ type: "start" })}\n\n`);

    // Create stream callback
    const streamHandler = (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    };

    const llmresponse = await llmService.processQuery(
      message,
      user.wallet,
      streamHandler
    );

    const processedResponse = await graphService.processGraphsInResponse(
      llmresponse,
      user.wallet
    );

    // Send the final message with visualizations
    if (
      processedResponse.visualizations &&
      processedResponse.visualizations.length > 0
    ) {
      res.write(
        `data: ${JSON.stringify({
          type: "visualization",
          visualization: processedResponse.visualizations[0],
        })}\n\n`
      );
    }

    res.write(
      `data: ${JSON.stringify({
        type: "complete",
        text: processedResponse.text,
      })}\n\n`
    );

    console.log("→ Chat LLM response processed for chatId:", chatId);
    res.end();
  } catch (e) {
    console.error("Error in chatLLM: ", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "internal service error" });
    } else {
      try {
        res.write(
          `data: ${JSON.stringify({ type: "error", error: e.message })}\n\n`
        );
        res.end();
      } catch (finalErr) {
        console.error("Error sending SSE response: ", finalErr);
      }
    }
  }
};
