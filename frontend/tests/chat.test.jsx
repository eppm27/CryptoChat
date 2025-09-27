import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("antd", () => {
  return {
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

vi.mock("../src/services/userAPI", () => {
  return {
    createChat: vi.fn(),
    getChatMessages: vi.fn(),
    deleteChat: vi.fn(),
    addPromptToSaved: vi.fn(),
    sendMessageToChat: vi.fn(),
  };
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatPage from "../src/pages/ChatPage";
import "@testing-library/jest-dom";
import * as userAPI from "../src/services/userAPI";
import { message } from "antd";

describe("ChatPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Setup userAPI mocks
    userAPI.createChat.mockResolvedValue({ chat: { _id: "mockChatId" } });
    userAPI.getChatMessages.mockResolvedValue({ messages: [] });
    userAPI.deleteChat.mockResolvedValue({});
    userAPI.addPromptToSaved.mockResolvedValue({});
    userAPI.sendMessageToChat.mockResolvedValue({});

    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("renders the ChatPage and displays a welcome message", async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/hello! i'm your crypto assistant/i)
    ).toBeInTheDocument();
  });

  it("displays user message immediately after sending", async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/ask me anything/i), {
      target: { value: "What is Bitcoin?" },
    });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("What is Bitcoin?")).toBeInTheDocument();
    });
  });

  it("clears chat and shows welcome message again", async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    await screen.findByText(/hello! i'm your crypto assistant/i);

    fireEvent.change(screen.getByPlaceholderText(/ask me anything/i), {
      target: { value: "price of ETH?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("price of ETH?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Clear Chat"));

    await waitFor(() => {
      expect(
        screen.getByText(/hello! i'm your crypto assistant/i)
      ).toBeInTheDocument();
    });
  });

  it("renders prompt suggestions for new chat", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/chat/new", state: { isNewChat: true } },
        ]}
      >
        <ChatPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/i'm your crypto assistant/i)
      ).toBeInTheDocument();
    });

    const promptBubbles = screen.getAllByText(
      (content, el) =>
        el?.className?.includes("cursor-pointer") && content.length > 0
    );
    expect(promptBubbles.length).toBeGreaterThanOrEqual(1);
  });

  it("shows save prompt success toast if last user message exists", async () => {
    userAPI.addPromptToSaved.mockResolvedValue({
      message: "Prompt saved successfully",
    });

    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/i'm your crypto assistant/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/ask me anything/i), {
      target: { value: "What is Solana?" },
    });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("What is Solana?")).toBeInTheDocument();
    });

    const saveButtons = screen.getAllByText((content, element) => {
      return (
        element.tagName.toLowerCase() === "button" &&
        element.getAttribute("aria-label") === "Save prompt"
      );
    });

    expect(saveButtons.length).toBeGreaterThan(0);
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(userAPI.addPromptToSaved).toHaveBeenCalled();
    });

    expect(message.success).toHaveBeenCalled();
  });

  it("renders download, saveprompt, and report buttons after bot replies", async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    const welcome = await screen.findByText(/i'm your crypto assistant/i);
    expect(welcome).toBeInTheDocument();

    expect(screen.getByLabelText("Download bot response")).toBeInTheDocument();
    expect(screen.getByLabelText("Save prompt")).toBeInTheDocument();
    expect(screen.getByLabelText("Report bot message")).toBeInTheDocument();
  });

  it("opens email client when report button is clicked", async () => {
    const originalHref = window.location.href;
    delete window.location;
    window.location = { href: "" };

    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Report bot message")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Report bot message"));

    expect(window.location.href).toMatch(/mailto:cryptochat\.it@gmail\.com/);

    window.location = { href: originalHref };
  });

  it("downloads bot response when download button is clicked", async () => {
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    const button = await screen.findByLabelText("Download bot response");

    fireEvent.click(button);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("sends message when Enter key is pressed", async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/ask me anything/i), {
      target: { value: "Testing Enter key" },
    });

    fireEvent.keyDown(screen.getByPlaceholderText(/ask me anything/i), {
      key: "Enter",
    });

    await waitFor(() => {
      expect(screen.getByText("Testing Enter key")).toBeInTheDocument();
    });
  });
});
