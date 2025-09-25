import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import WalletPage from '../src/pages/WalletPage'; 
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from 'react-router-dom';
import React from 'react'; 
import{ fetchUserData } from '../src/services/userAPI';

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
      const addToWalletButton = screen.getByRole('button', { name: /Add Crypto to Wallet/i }); // checks if button exists
      expect(addToWalletButton).toBeInTheDocument();

      // check button clicked action - add modal
      await fireEvent.click(addToWalletButton);
    
      const modal = screen.getByTestId('add-modal');
      expect(within(modal).getByText(/Add Crypto to Wallet/i)).to.exist;
      
      expect(screen.getByText(/Select Coin:/i)).to.exist;
      const selectBox = screen.getByText("Choose a crypto");
      expect(selectBox).toBeInTheDocument();
      expect(screen.getByText(/Amount:/i)).to.exist;
      const amountBox = screen.queryByPlaceholderText(/e.g. 2.5/i);
      expect(amountBox).not.toBeNull();
      const cancelButton = screen.getByRole('button', { name: /Cancel/i }); 
      const saveButton = screen.getByRole('button', { name: /Save/i }); 
      expect(cancelButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();

      // check if modal can be closed
      await fireEvent.click(cancelButton);  
      expect(screen.queryByTestId('add-modal')).to.be.null;
    });
  });

  it('renders user wallet - with items', async () => {
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
      const addToWalletButton = screen.getByRole('button', { name: /Add New Crypto/i }); // checks if button exists
      expect(addToWalletButton).toBeInTheDocument();

      expect(screen.getByText("Name")).to.exist;
      expect(screen.getByText("Amount")).to.exist;
    });
  });
});