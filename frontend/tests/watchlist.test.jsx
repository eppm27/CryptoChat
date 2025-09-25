import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import WatchlistPage from '../src/pages/WatchlistPage'; 
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from 'react-router-dom';
import React from 'react'; 
import{ fetchUserData } from '../src/services/userAPI';
import { fetchCryptoDetailsDatabase } from '../src/services/cryptoAPI';

vi.mock('../src/services/userAPI', () => ({
  fetchUserData: vi.fn(),
}));

vi.mock('../src/services/cryptoAPI', () => ({
  fetchCryptoDetailsDatabase: vi.fn(),
}));


describe('Watchlist Page', () => {
  it('renders user watchlist - without items', async () => {
    fetchUserData.mockResolvedValue({
      fullName: 'Tiffany Cheng',
      email: 'Tiffany@gmail.com',
      savedPrompts: [],
      wallet: [],
      watchlist: []
    });

    render( // wraps the page up for useNavigate
      <MemoryRouter>
        <WatchlistPage /> 
      </MemoryRouter>
    );

    await waitFor(async () => {
      screen.debug(); 
      
      expect(screen.getByText("Watchlist")).to.exist; // title

      // empty page interface 
      expect(screen.getByText("Your watchlist is currently empty")).to.exist; 
      const addToWatchlistButton = screen.getByRole('button', { name: /Add items to Watchlist/i }); // checks if button exists
      expect(addToWatchlistButton).toBeDefined();

      // check button clicked action - add modal
      await fireEvent.click(addToWatchlistButton); //that it would trigger a modal then how do i check that?? 
      expect(screen.getByText(/Add Crypto to Watchlist/i)).to.exist;
      expect(screen.getByText(/Select Coin:/i)).to.exist;
      const selectBox = screen.getByText("Choose a crypto");
      expect(selectBox).toBeDefined();
      const cancelButton = screen.getByRole('button', { name: /Cancel/i }); 
      const saveButton = screen.getByRole('button', { name: /Save/i }); 
      expect(cancelButton).toBeDefined();
      expect(saveButton).toBeDefined();

      // check if modal can be closed
      await fireEvent.click(cancelButton);  
      expect(screen.queryByTestId('add-modal')).to.be.null;

    });
  });

  it('renders user watchlist - with items', async () => {
    fetchUserData.mockResolvedValue({
      fullName: 'Tiffany Cheng',
      email: 'Tiffany@gmail.com',
      savedPrompts: [ ],
      wallet: [ ],
      watchlist: [  // so have empty watchlist for now
        {cryptoName: 'Bitcoin', cryptoSymbol: 'btc', cryptoId: 'bitcoin', _id: '68052008354a5d89b520539f'},
      ]
    });

    // but this time what we ask for is different now
    fetchCryptoDetailsDatabase.mockResolvedValue([
      {
        current_price: 148968,
        id: "bitcoin",
        market_cap: 2957488793870,
        name: "Bitcoin",
        price_change_percentage_1h_in_currency: -0.010637809403652956,
        price_change_percentage_7d_in_currency: 4.980260590929531,
        price_change_percentage_24h_in_currency: 2.059117251594425,
        userWatchlistInfo: [{cryptoId: "bitcoin"}, {cryptoName: "Bitcoin"}, {cryptoSymbol: "btc"},{ _id: "68052008354a5d89b520539f"}]
      }, 

    ]);

    render( // wraps the page up for useNavigate
      <MemoryRouter>
        <WatchlistPage /> 
      </MemoryRouter>
    );

    await waitFor(async () => {
      screen.debug(); 
      
      expect(screen.getByText("Watchlist")).toBeDefined();// title

      // check for the table as will - at least the header or smt
      expect(screen.getByText("Name")).toBeDefined();
      expect(screen.getByText("Price")).toBeDefined();
      expect(screen.getByText("1h")).toBeDefined();
      expect(screen.getByText("24h")).toBeDefined();
      expect(screen.getByText("7d")).toBeDefined();
      expect(screen.getByText("Market Cap")).toBeDefined();
      expect(screen.getByText("Last 7 Days")).toBeDefined();

      const addButton = screen.getByRole('button', { name: /Add New Crypto/i }); // checks if button exists
      expect(addButton).toBeDefined();

      // click on add button
      await fireEvent.click(addButton);
      expect(screen.getByText(/Add Crypto to Watchlist/i)).toBeDefined(); // triggers modal
      expect(screen.getByText(/Select Coin:/i)).toBeDefined();
      const selectBox = screen.getByText("Choose a crypto");
      expect(selectBox).toBeDefined();
      const cancelButton = screen.getByRole('button', { name: /Cancel/i }); 
      const saveButton = screen.getByRole('button', { name: /Save/i }); 
      expect(cancelButton).toBeDefined();
      expect(saveButton).toBeDefined();
    });
  });
});
