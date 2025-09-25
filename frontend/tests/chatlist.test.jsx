import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ChatListPage from "../src/pages/ChatlistPage";
import * as userAPI from "../src/services/userAPI";
import "@testing-library/jest-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../src/services/userAPI");

const mockChats = [
  {
    _id: "1",
    title: "Chat 1",
    lastMessage: "Hello",
    updatedAt: "2025-04-29T12:00:00Z",
  },
  {
    _id: "2",
    title: "Chat 2",
    lastMessage: "Hi there",
    updatedAt: "2025-04-28T15:00:00Z",
  },
];

describe("ChatListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page and fetches chats", async () => {
    userAPI.getAllChats.mockResolvedValue(mockChats);

    render(
      <BrowserRouter>
        <ChatListPage />
      </BrowserRouter>
    );

    expect(screen.getByText("+ Start New Chat")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Chat 1")).toBeInTheDocument();
      expect(screen.getByText("Chat 2")).toBeInTheDocument();
    });
  });

  it("handles errors when fetching chats", async () => {
    userAPI.getAllChats.mockRejectedValue(new Error("Failed to fetch chats"));

    render(
      <BrowserRouter>
        <ChatListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load chats. Please try again later.")
      ).toBeInTheDocument();
    });
  });

  it("starts a new chat when the button is clicked", async () => {
    const mockNewChat = { chat: { _id: "3" } };
    userAPI.createChat.mockResolvedValue(mockNewChat);

    render(
      <BrowserRouter>
        <ChatListPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("+ Start New Chat"));

    await waitFor(() => {
      expect(userAPI.createChat).toHaveBeenCalledTimes(1);
    });
  });

  it("navigates to an existing chat when clicked", async () => {
    userAPI.getAllChats.mockResolvedValue(mockChats);
    userAPI.getChatMessages.mockResolvedValue({
      messages: [
        { content: "Hello", role: "user", isError: false },
        { content: "Hi", role: "chatBot", isError: false },
      ],
    });

    render(
      <BrowserRouter>
        <ChatListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Chat 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Chat 1"));

    await waitFor(() => {
      expect(userAPI.getChatMessages).toHaveBeenCalledWith("1");
    });
  });

  it("displays a message when no chats are available", async () => {
    userAPI.getAllChats.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <ChatListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText("No chats available. Start a new chat!")
      ).toBeInTheDocument();
    });
  });

  it("removes a chat from the list after successful deletion", async () => {
    userAPI.getAllChats.mockResolvedValue(mockChats);

    render(
      <BrowserRouter>
        <ChatListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Chat 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByTitle("Delete Chat")[0]);

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(screen.queryByText("Chat 1")).not.toBeInTheDocument();
    });
  });
});
