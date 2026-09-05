import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import WalletPage from '../src/pages/WalletPage'; 
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

describe('Wallet Page', () => {
  it('renders user wallet - without items', async () => {
    fetchUserData.mockResolvedValue({
      fullName: 'Tiffany Cheng',
      email: 'Tiffany@gmail.com',
      savedPrompts: [],
      wallet: [],
      watchlist: []
    });

    render( // wraps the page up for useNavigate
      <MemoryRouter>
        <WalletPage /> 
      </MemoryRouter>
    );

    await waitFor(async () => {
      screen.debug(); 
      
      expect(screen.getByText("My Crypto Wallet")).to.exist; // title

      // empty page interface 
      expect(screen.getByText("Your wallet is empty")).to.exist; 
      const addToWalletButton = screen.getByRole('button', { name: /Add Your First Crypto/i }); // checks if button exists
      expect(addToWalletButton).toBeInTheDocument();

      // check button clicked action - add modal
      await fireEvent.click(addToWalletButton);
    
      const modal = screen.getByTestId('add-modal');
      expect(within(modal).getByText(/Add Crypto to Wallet/i)).to.exist;
      
      expect(screen.getByText(/Search Cryptocurrency/i)).to.exist;
      expect(screen.getByPlaceholderText(/Search Bitcoin/i)).toBeInTheDocument();
      const cancelButton = screen.getByRole('button', { name: /Cancel/i }); 
      expect(cancelButton).toBeInTheDocument();

      // check if modal can be closed
      await fireEvent.click(cancelButton);  
      expect(screen.queryByTestId('add-modal')).to.be.null;
    });
  });

  it('renders user wallet - with items', async () => {
    fetchCryptoDetailsDatabase.mockResolvedValue([{ id: "aave", name: "Aave", current_price: 250, price_change_percentage_24h: 1.5 }]);
    fetchUserData.mockResolvedValue({
      fullName: 'Tiffany Cheng',
      email: 'Tiffany@gmail.com',
      savedPrompts: [],
      wallet: [
        {cryptoName: 'Aave', cryptoSymbol: 'aave', cryptoId: 'aave', amount: 2, _id: '6805445ba022cb1739dd56f5'},
      ],
      watchlist: []
    });

    render( 
      <MemoryRouter>
        <WalletPage /> 
      </MemoryRouter>
    );

    await waitFor(async () => {
      screen.debug(); 
      
      expect(screen.getByText("My Crypto Wallet")).to.exist; // title

      // page interface 
      const addToWalletButton = screen.getAllByRole('button', { name: /Add Crypto/i })[0]; // checks if button exists
      expect(addToWalletButton).toBeInTheDocument();

      expect(screen.getByText("Your Holdings")).to.exist;
      expect(screen.getByText("Aave")).to.exist;
    });
  });
});
