import { vi, describe, it, expect } from "vitest";

vi.mock("../src/services/cryptoAPI", () => ({
  fetchCryptoDetailsDatabase: vi.fn(),
}));

vi.mock("@mui/x-data-grid", async () => {
  const React = await import("react");
  const PropTypes = await import("prop-types");

  const DataGrid = (props) => {
    return React.createElement("div", { "data-testid": "mock-data-grid" }, [
      React.createElement(
        "div",
        { "data-testid": "header-row", key: "header" },
        (props.columns || []).map((col) =>
          React.createElement(
            "div",
            {
              key: col.field,
              "data-testid": `header-${col.field}`,
              className: "table-header",
            },
            col.headerName
          )
        )
      ),
      ...(props.rows || []).map((row, rowIndex) =>
        React.createElement(
          "div",
          { "data-testid": `row-${rowIndex}`, key: `row-${rowIndex}` },
          (props.columns || []).map((col) =>
            React.createElement(
              "div",
              {
                key: col.field,
                "data-testid": `cell-${rowIndex}-${col.field}`,
              },
              row[col.field]
            )
          )
        )
      ),
    ]);
  };

  DataGrid.propTypes = {
    columns: PropTypes.default.arrayOf(
      PropTypes.default.shape({
        field: PropTypes.default.string.isRequired,
        headerName: PropTypes.default.string.isRequired,
      })
    ).isRequired,
    rows: PropTypes.default.arrayOf(PropTypes.default.object).isRequired,
  };

  return { DataGrid };
});

vi.mock("@mui/material", async () => {
  const React = await import("react");
  const PropTypes = await import("prop-types");

  const Container = (props) =>
    React.createElement(
      "div",
      { ...props, "data-testid": "mui-container" },
      props.children
    );
  Container.propTypes = {
    children: PropTypes.default.node,
  };

  const Typography = (props) =>
    React.createElement(
      "div",
      { ...props, "data-testid": "mui-typography" },
      props.children
    );
  Typography.propTypes = {
    children: PropTypes.default.node,
  };

  const Box = (props) =>
    React.createElement(
      "div",
      { ...props, "data-testid": "mui-box" },
      props.children
    );
  Box.propTypes = {
    children: PropTypes.default.node,
  };

  return {
    Container,
    Typography,
    Box,
  };
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CryptoExplorePage from "../src/pages/CryptoExplorePage";
import { fetchCryptoDetailsDatabase } from "../src/services/cryptoAPI";

describe("Crypto Explore Page", () => {
  it("renders crypto explore page", async () => {
    fetchCryptoDetailsDatabase.mockResolvedValue([
      {
        current_price: 148968,
        id: "bitcoin",
        market_cap: 2957488793870,
        market_cap_rank: 1,
        name: "Bitcoin",
        total_volume: 36947671628,
        price_change_percentage_1h_in_currency: -0.010637809403652956,
        price_change_percentage_7d_in_currency: 4.980260590929531,
        price_change_percentage_24h_in_currency: 2.059117251594425,
      },
      {
        current_price: 2822.49,
        id: "ethereum",
        market_cap: 340843096462,
        market_cap_rank: 2,
        name: "Ethereum",
        total_volume: 21371072612,
        price_change_percentage_1h_in_currency: 0.0075255303039899095,
        price_change_percentage_24h_in_currency: 0.9609936046015837,
        price_change_percentage_7d_in_currency: 0.09074077274249047,
      },
    ]);

    render(
      <MemoryRouter>
        <CryptoExplorePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Explore Cryptocurrencies/i)
      ).toBeInTheDocument();

      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
      expect(screen.getByText("Ethereum")).toBeInTheDocument();
      expect(screen.getAllByText(/Market Cap/i).length).toBeGreaterThan(0);
    });
  });
});
