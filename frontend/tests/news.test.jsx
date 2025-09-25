import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import NewsPage from "../src/pages/NewsPage";
import "@testing-library/jest-dom";

globalThis.fetch = vi.fn();

const mockArticles = [
  {
    _id: "1",
    title: "Bitcoin surges past $60K",
    summary: "Bitcoin hits new highs amid market optimism.",
    url: "https://example.com/bitcoin-news",
    source: "CryptoNews",
    tickers: ["BTC", "ETH"],
  },
  {
    _id: "2",
    title: "Ethereum upgrade launches",
    summary: "New changes could improve gas efficiency.",
    url: "https://example.com/eth-news",
    source: "BlockFeed",
    tickers: [],
  },
];

describe("NewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays news articles after successful fetch", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArticles,
    });

    render(<NewsPage />);

    await waitFor(() => {
      expect(screen.getByText("Bitcoin surges past $60K")).toBeInTheDocument();
      expect(screen.getByText("Ethereum upgrade launches")).toBeInTheDocument();
      expect(screen.getByText("CryptoNews")).toBeInTheDocument();
      expect(screen.getByText("BTC")).toBeInTheDocument();
    });
  });

  it("displays error message when fetch fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
    });

    render(<NewsPage />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch news/i)).toBeInTheDocument();
    });
  });

  it("displays error message if fetch throws", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<NewsPage />);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("handles empty news list gracefully", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<NewsPage />);

    await waitFor(() => {
      expect(screen.getByText(/latest news/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/bitcoin surges past/i)
      ).not.toBeInTheDocument();
    });
  });
});
