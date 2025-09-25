import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Header from '../src/components/Header';
import { describe, it, expect } from "vitest";

const testPage = async (route, headingText, menuItemsToExclude = []) => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Header />
    </MemoryRouter>
  );

  // Check if the heading for the route is correct and matches the page title
  expect(screen.getByRole("heading", { name: new RegExp(headingText, "i") })).toBeInTheDocument();

  // Check menu items
  const menuButton = screen.getByLabelText("Toggle Menu");
  await fireEvent.click(menuButton);

  const menu = screen.getByTestId("dropdown-menu");
  const inMenu = within(menu);

  // Test if the menu items are correct
  const allMenuItems = [
    "Chats", "Watchlist", "Saved", "Wallet", "News", "Explore", "Dashboard"
  ];

  // Check for items that should be visible
  allMenuItems.forEach(item => {
    if (menuItemsToExclude.includes(item)) {
      expect(inMenu.queryByText(item)).toBeNull();
    } else {
      expect(inMenu.getByText(item)).toBeInTheDocument();
    }
  });
};

describe('Header title and menu on different pages', () => {
  it("shows 'Dashboard' on /dashboard", async () => {
    await testPage("/dashboard", "Dashboard", ["Dashboard"]);
  });

  it("shows 'Explore' on /cryptos", async () => {
    await testPage("/cryptos", "Explore", ["Explore"]);
  });

  it("shows 'Chatlist' on /chat", async () => {
    await testPage("/chat", "Chatlist", ["Chats"]);
  });

  it("shows 'Saved' on /saved", async () => {
    await testPage("/saved", "Saved", ["Saved"]);
  });

  it("shows 'Wallet' on /wallet", async () => {
    await testPage("/wallet", "Wallet", ["Wallet"]);
  });

  it("shows 'Watchlist' on /watchlist", async () => {
    await testPage("/watchlist", "Watchlist", ["Watchlist"]);
  });

  it("shows 'Profile' on /profile", async () => {
    await testPage("/profile", "Profile", ["Profile"]);
  });

  it("shows 'News' on /news", async () => {
    await testPage("/news", "News", ["News"]);
  });

  it("shows 'Chat' on /chat/:id", async () => {
    await testPage("/chat/6811cf2b7170f7d44614795b", "Chat", ["Chats"]);
  });

  it("shows 'Details' on /cryptoDetails/bitcoin", async () => {
    await testPage("/cryptoDetails/bitcoin", "Details", ["Profile"]);
  });
});