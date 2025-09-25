import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../src/pages/DashboardPage";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { fetchUserData } from "../src/services/userAPI";
import { fetchCryptoDetailsDatabase } from "../src/services/cryptoAPI";
import "@testing-library/jest-dom";

vi.mock("../src/services/userAPI", () => ({
  fetchUserData: vi.fn(),
}));

vi.mock("../src/services/cryptoAPI", () => ({
  fetchCryptoDetailsDatabase: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    fetchUserData.mockResolvedValue({
      firstName: "Tiffany",
      lastName: "Cheng",
      email: "Tiffany@gmail.com",
      savedPrompts: [
        { prompt: "first", _id: "68054493a022cb1739dd5733" },
        { prompt: "second", _id: "68054497a022cb1739dd574c" },
      ],
      wallet: [],
      watchlist: [
        {
          cryptoName: "Bitcoin",
          cryptoSymbol: "btc",
          cryptoId: "bitcoin",
          _id: "68052008354a5d89b520539f",
        },
      ],
    });

    fetchCryptoDetailsDatabase.mockResolvedValue([
      {
        current_price: 148968,
        id: "bitcoin",
        market_cap: 2957488793870,
        name: "Bitcoin",
        price_change_24h: 3005.53,
        price_change_percentage_1h_in_currency: -0.010637809403652956,
        price_change_percentage_7d_in_currency: 4.980260590929531,
        price_change_percentage_24h_in_currency: 2.059117251594425,
        userWatchlistInfo: [
          { cryptoId: "bitcoin" },
          { cryptoName: "Bitcoin" },
          { cryptoSymbol: "btc" },
          { _id: "68052008354a5d89b520539f" },
        ],
      },
    ]);

    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
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
        ]),
    });
  });

  it("renders dashboard components", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(async () => {
      // not required for userData info
      expect(
        screen.getByText((content) => content.includes("Welcome, Tiffany"))
      ).toBeTruthy();
      expect(
        screen.getByText((content) =>
          content.includes("Start today’s financial journey here!")
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes("Watchlist"))
      ).toBeInTheDocument();

      // watchlist column headers
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Price")).toBeInTheDocument();
      expect(screen.getByText("24h Change")).toBeInTheDocument();
      expect(screen.getByText("Market Cap")).toBeInTheDocument();
      expect(screen.getByText("Last 7 Days")).toBeInTheDocument();

      // prompt
      expect(
        screen.getByText((content) => content.includes("Saved"))
      ).toBeInTheDocument();
      expect(screen.getByText("Prompt")).toBeInTheDocument();

      expect(
        screen.getByText((content) => content.includes("Quick Start"))
      ).toBeInTheDocument();
      const promptElements = screen.getAllByTestId("quick-start-prompt");
      expect(promptElements).toHaveLength(3);

      // news
      expect(
        screen.getByText((content) => content.includes("Latest News"))
      ).toBeInTheDocument();
      expect(screen.getByText("Bitcoin surges past $60K")).toBeInTheDocument();
      expect(screen.getByText("Ethereum upgrade launches")).toBeInTheDocument();
      expect(screen.getByText("CryptoNews")).toBeInTheDocument();
      expect(screen.getByText("BlockFeed")).toBeInTheDocument();

      // chat button exists
      expect(screen.getByAltText("Go to Chat")).toBeInTheDocument();
    });
  });
});
