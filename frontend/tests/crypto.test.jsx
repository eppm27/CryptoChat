import { render, screen, waitFor } from "@testing-library/react";
import CryptoDetailsPage from "../src/pages/CryptoDetailsPage";
import { expect, vi, it, beforeEach, describe } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import React from "react";
import {
  fetchUserData,
  deleteCryptoFromWatchlist,
} from "../src/services/userAPI";
import { fetchCryptoDetailsDatabase } from "../src/services/cryptoAPI";

vi.mock("../src/services/userAPI", () => ({
  fetchUserData: vi.fn(),
  deleteCryptoFromWatchlist: vi.fn(),
  addCryptoToWatchlist: vi.fn(),
}));

vi.mock("../src/services/cryptoAPI", () => ({
  fetchCryptoDetailsDatabase: vi.fn(),
}));

describe("Bitcoin crypto page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    fetchUserData.mockResolvedValue({
      fullName: "Tiffany Cheng",
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

    fetchCryptoDetailsDatabase.mockResolvedValue(
      {
        ath: 175258,
        ath_change_percentage: -15.06296,
        ath_date: "2025-01-20T09:11:54.494Z",
        atl: 72.61,
        atl_change_percentage: 204913.78743,
        atl_date: "2013-07-05T00:00:00.000Z",
        categories: [
          "Smart Contract Platform",
          "Layer 1 (L1)",
          "FTX Holdings",
          "Proof of Work (PoW)",
          "Bitcoin Ecosystem",
          "GMCI 30 Index",
          "GMCI Index",
          "Coinbase 50 Index",
        ],
        circulating_supply: 19857768,
        coinType: "",
        communityLinks: {
          reddit: "https://www.reddit.com/r/Bitcoin/",
          twitter: "https://twitter.com/bitcoin",
          facebook: "https://www.facebook.com/bitcoins",
          telegram: "",
          instagram: "",
        },
        current_price: 148968,
        description:
          "Bitcoin is the first successful internet money based on peer-to-peer technology; whereby no central bank or authority is involved in the transaction and production of the Bitcoin currency. It was created by an anonymous individual/group under the name, Satoshi Nakamoto. The source code is available publicly as an open source project, anybody can look at it and be part of the developmental process.\r\n\r\nBitcoin is changing the way we see money as we speak. The idea was to produce a means of exchange, independent of any central authority, that could be transferred electronically in a secure, verifiable and immutable way. It is a decentralized peer-to-peer internet currency making mobile payment easy, very low transaction fees, protects your identity, and it works anywhere all the time with no central authority and banks.\r\n\r\nBitcoin is designed to have only 21 million BTC ever created, thus making it a deflationary currency. Bitcoin uses the SHA-256 hashing algorithm with an average transaction confirmation time of 10 minutes. Miners today are mining Bitcoin using ASIC chip dedicated to only mining Bitcoin, and the hash rate has shot up to peta hashes.\r\n\r\nBeing the first successful online cryptography currency, Bitcoin has inspired other alternative currencies such as Litecoin, Peercoin, Primecoin, and so on.\r\n\r\nThe cryptocurrency then took off with the innovation of the turing-complete smart contract by Ethereum which led to the development of other amazing projects such as EOS, Tron, and even crypto-collectibles such as CryptoKitties.",
        fully_diluted_valuation: 2957493559745,
        genesisDate: "2009-01-03",
        high_7d: 95501.30690513337,
        high_24h: 149277,
        homepageLink: "http://www.bitcoin.org",
        id: "bitcoin",
        image:
          "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
        last_updated: "2025-04-29T17:36:38.002Z",
        low_7d: 84093.83367559967,
        low_24h: 145962,
        market_cap: 2957488793870,
        market_cap_change_24h: 60072342261,
        market_cap_change_percentage_24h: 2.07331,
        market_cap_rank: 1,
        max_supply: 21000000,
        name: "Bitcoin",
        price_change_24h: 3005.53,
        price_change_percentage_1h_in_currency: -0.010637809403652956,
        price_change_percentage_7d_in_currency: 4.980260590929531,
        price_change_percentage_24h: 2.05912,
        price_change_percentage_24h_in_currency: 2.059117251594425,
        userWatchlistInfo: [
          { cryptoId: "bitcoin" },
          { cryptoName: "Bitcoin" },
          { cryptoSymbol: "btc" },
          { _id: "68052008354a5d89b520539f" },
        ],
        roi: null,
        sparkline_in_7d: [
          88615.97002846011, 88978.81535347943, 90194.6121299601,
          90772.12442241653, 90907.45862548235, 90772.46208096718,
          91486.13734433235, 91502.62798566568, 91443.57232155654,
          91181.31706325726, 92780.03301369656, 92890.82073039186,
          93518.26130183092, 92980.77660341187, 92765.40196195075,
          92861.56559827678, 93191.46336099145, 93539.16589703153,
          93533.65711519695, 93680.63487801861, 93966.3329099382,
          94294.96451438825, 93845.59854642389, 93715.60255843068,
          93491.06534555122, 93772.95768584043, 93257.51177479739,
          93028.64308888822, 93025.32634165006, 93660.67063956453,
          93871.60137754977, 93702.96947748295, 93534.41629158678,
          93720.32472543613, 93457.78218613163, 93775.79949419561,
          93692.84058767844, 93433.21370990733, 93559.06623076717,
          93177.55820369317, 92791.86738499445, 92830.13674508072,
          92422.33360998418, 92481.314870863, 92215.58688600673,
          91979.55746381238, 92439.36671109166, 92612.10443532834,
          92619.17159627969, 92758.39429904126, 92792.50515530353,
          93148.31526966579, 93263.62351695224, 93440.4683204101,
          93008.71420843324, 93426.4096716433, 93646.9616071421,
          93499.2338094935, 93368.35893682836, 93463.48432069764,
          93950.39664992713, 93937.73291095014, 93724.29216200934,
          93056.1298372759, 93340.28087687395, 93109.0023842389,
          93263.24896812698, 93584.09278760613, 93768.70443780805,
          93672.32266122216, 93826.3479104858, 93667.68760388183,
          94610.85462379066, 94458.97869936838, 94489.4100285538,
          95501.30690513337, 95132.21312364972, 95292.65874105405,
          94715.48156893643, 95057.4656296913, 95182.4305032165,
          94953.82159752958, 94682.09884824745, 94928.50897300708,
          94800.21413700008, 94888.07294762752, 95066.6945668174,
          95078.20905423805, 94791.3808696889, 94642.75101322084,
          94671.43197965455, 94734.50640966927, 94687.45719807257,
          94413.16016295046, 94272.05009027116, 94283.01021932048,
          94189.89391089336, 94293.46684998806, 94103.96485256299,
          94305.68621590677,
        ],
        symbol: "btc",
        total_supply: 19857800,
        total_volume: 36947671628,
        whitepaperLink: "https://bitcoin.org/bitcoin.pdf",
        __v: 0,
        _id: "680cec01c9688d8e81ddd8b3",
      },
      {
        ath: 0.359871,
        ath_change_percentage: -72.18228,
        ath_date: "2024-12-01T16:31:18.357Z",
        atl: 0.00130249,
        atl_change_percentage: 7585.8921,
        atl_date: "2024-02-29T08:40:24.951Z",
        categories: [
          "Meme",
          "Base Ecosystem",
          "Frog-Themed",
          "Base Meme",
          "The Boy’s Club",
        ],
        circulating_supply: 9909870406.910961,
        coinType: "",
        communityLinks: {
          reddit: "https://www.reddit.com",
          twitter: "https://twitter.com/BasedBrett",
          facebook: "",
          telegram: "https://t.me/basedbrett",
          instagram: "",
        },
        current_price: 0.100042,
        description:
          "Bitcoin is the first successful internet money based on peer-to-peer technology; whereby no central bank or authority is involved in the transaction and production of the Bitcoin currency. It was created by an anonymous individual/group under the name, Satoshi Nakamoto. The source code is available publicly as an open source project, anybody can look at it and be part of the developmental process.\r\n\r\nBitcoin is changing the way we see money as we speak. The idea was to produce a means of exchange, independent of any central authority, that could be transferred electronically in a secure, verifiable and immutable way. It is a decentralized peer-to-peer internet currency making mobile payment easy, very low transaction fees, protects your identity, and it works anywhere all the time with no central authority and banks.\r\n\r\nBitcoin is designed to have only 21 million BTC ever created, thus making it a deflationary currency. Bitcoin uses the SHA-256 hashing algorithm with an average transaction confirmation time of 10 minutes. Miners today are mining Bitcoin using ASIC chip dedicated to only mining Bitcoin, and the hash rate has shot up to peta hashes.\r\n\r\nBeing the first successful online cryptography currency, Bitcoin has inspired other alternative currencies such as Litecoin, Peercoin, Primecoin, and so on.\r\n\r\nThe cryptocurrency then took off with the innovation of the turing-complete smart contract by Ethereum which led to the development of other amazing projects such as EOS, Tron, and even crypto-collectibles such as CryptoKitties.",
        fully_diluted_valuation: 990963636,
        genesisDate: "",
        high_7d: 0.06929061595335567,
        high_24h: 0.103275,
        homepageLink: "https://www.basedbrett.com/",
        id: "based-brett",
        image:
          "https://coin-images.coingecko.com/coins/images/35529/large/1000050750.png?1709031995",
        last_updated: "2025-04-29T17:36:30.886Z",
        low_7d: 0.03340692226835064,
        low_24h: 0.096666,
        market_cap: 990963636,
        market_cap_change_24h: 36120504,
        market_cap_change_percentage_24h: 3.78287,
        market_cap_rank: 130,
        max_supply: 9999998988,
        name: "Brett",
        price_change_24h: 0.00337609,
        price_change_percentage_1h_in_currency: -1.3510524396510368,
        price_change_percentage_7d_in_currency: 74.44037046044723,
        price_change_percentage_24h: 3.49252,
        price_change_percentage_24h_in_currency: 3.492517500720406,
        roi: null,
        sparkline_in_7d: [
          88615.97002846011, 88978.81535347943, 90194.6121299601,
          90772.12442241653, 90907.45862548235, 90772.46208096718,
          91486.13734433235, 91502.62798566568, 91443.57232155654,
          91181.31706325726, 92780.03301369656, 92890.82073039186,
          93518.26130183092, 92980.77660341187, 92765.40196195075,
          92861.56559827678, 93191.46336099145, 93539.16589703153,
          93533.65711519695, 93680.63487801861, 93966.3329099382,
          94294.96451438825, 93845.59854642389, 93715.60255843068,
          93491.06534555122, 93772.95768584043, 93257.51177479739,
          93028.64308888822, 93025.32634165006, 93660.67063956453,
          93871.60137754977, 93702.96947748295, 93534.41629158678,
          93720.32472543613, 93457.78218613163, 93775.79949419561,
          93692.84058767844, 93433.21370990733, 93559.06623076717,
          93177.55820369317, 92791.86738499445, 92830.13674508072,
          92422.33360998418, 92481.314870863, 92215.58688600673,
          91979.55746381238, 92439.36671109166, 92612.10443532834,
          92619.17159627969, 92758.39429904126, 92792.50515530353,
          93148.31526966579, 93263.62351695224, 93440.4683204101,
          93008.71420843324, 93426.4096716433, 93646.9616071421,
          93499.2338094935, 93368.35893682836, 93463.48432069764,
          93950.39664992713, 93937.73291095014, 93724.29216200934,
          93056.1298372759, 93340.28087687395, 93109.0023842389,
          93263.24896812698, 93584.09278760613, 93768.70443780805,
          93672.32266122216, 93826.3479104858, 93667.68760388183,
          94610.85462379066, 94458.97869936838, 94489.4100285538,
          95501.30690513337, 95132.21312364972, 95292.65874105405,
          94715.48156893643, 95057.4656296913, 95182.4305032165,
          94953.82159752958, 94682.09884824745, 94928.50897300708,
          94800.21413700008, 94888.07294762752, 95066.6945668174,
          95078.20905423805, 94791.3808696889, 94642.75101322084,
          94671.43197965455, 94734.50640966927, 94687.45719807257,
          94413.16016295046, 94272.05009027116, 94283.01021932048,
          94189.89391089336, 94293.46684998806, 94103.96485256299,
          94305.68621590677,
        ],
        symbol: "brett",
        total_supply: 9909870406.910961,
        total_volume: 57038986,
        whitepaperLink: "",
        __v: 0,
        _id: "680cf34cc9688d8e81ddd93e",
      }
    );

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

  it("renders bitcoin - exists in watchlist", async () => {
    const mockCryptoId = "bitcoin";

    render(
      <MemoryRouter initialEntries={[`/crypto/${mockCryptoId}`]}>
        <Routes>
          <Route path="/crypto/:cryptoId" element={<CryptoDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check if tabs are rendered
      expect(screen.getAllByRole("tab")).toHaveLength(3);
      expect(
        screen.getByRole("tab", { name: /Overview/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Info/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /News/i })).toBeInTheDocument();
    });

    const watchlistButton = await screen.findByRole("button", {
      name: /Remove from Watchlist/i,
    });
    expect(watchlistButton).toBeInTheDocument();

    // crypto header info
    expect(screen.getByText("AUD")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    const btcText = screen.getAllByText("BTC");
    expect(btcText.length).toBeGreaterThan(0);

    expect(screen.getByText("$148,968.00")).toBeInTheDocument(); // current price

    // crypto graph exists
    expect(screen.getByTestId("crypto-graph")).toBeInTheDocument();

    // check for three data section headings
    const bitcoinStatsHeading = Array.from(
      screen.getAllByText(/Bitcoin Statistics/i)
    ).find(
      // statistical section
      (element) =>
        element.tagName === "P" && element.classList.contains("font-bold")
    );
    expect(bitcoinStatsHeading).toBeInTheDocument();

    const infoHeading = Array.from(screen.getAllByText(/Info/i)).find(
      // info section
      (element) =>
        element.tagName === "P" && element.classList.contains("font-bold")
    );
    expect(infoHeading).toBeInTheDocument();

    const historicalDataHeading = Array.from(
      screen.getAllByText(/BTC Historical Data/i)
    ).find(
      // historical section
      (element) =>
        element.tagName === "P" && element.classList.contains("font-bold")
    );
    expect(historicalDataHeading).toBeInTheDocument();

    const descriptionHeading = Array.from(screen.getAllByText(/About/i)).find(
      (element) =>
        element.tagName === "P" && element.classList.contains("font-bold")
    );
    expect(descriptionHeading).toBeInTheDocument();
    expect(
      screen.getByText(/Bitcoin is the first successful internet money/)
    ).toBeInTheDocument(); // description section

    const RSIHeading = Array.from(screen.getAllByText(/BTC RSI/i)).find(
      // RSI sections
      (element) =>
        element.tagName === "P" && element.classList.contains("font-bold")
    );
    expect(RSIHeading).toBeInTheDocument();
  });

  it("toggle button - remove crypto from watchlist, button state change", async () => {
    const mockCryptoId = "bitcoin";

    deleteCryptoFromWatchlist.mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={[`/crypto/${mockCryptoId}`]}>
        <Routes>
          <Route path="/crypto/:cryptoId" element={<CryptoDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const watchlistButton = await screen.findByRole("button", {
      name: /Remove from Watchlist/i,
    });
    expect(watchlistButton).toBeInTheDocument();

    watchlistButton.click();

    await waitFor(async () => {
      expect(deleteCryptoFromWatchlist).toHaveBeenCalledTimes(1);
      const watchlistButton = await screen.findByRole("button", {
        name: /Add To Watchlist/i,
      });
      expect(watchlistButton).toBeInTheDocument();
    });
  });

  it("render related news", async () => {
    const mockCryptoId = "bitcoin";

    render(
      <MemoryRouter initialEntries={[`/crypto/${mockCryptoId}`]}>
        <Routes>
          <Route path="/crypto/:cryptoId" element={<CryptoDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Related News")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Bitcoin surges past $60K")).toBeInTheDocument();
      expect(screen.getByText("Ethereum upgrade launches")).toBeInTheDocument();
      expect(screen.getByText("CryptoNews")).toBeInTheDocument();
      expect(screen.getByText("BlockFeed")).toBeInTheDocument();
    });
  });
});
