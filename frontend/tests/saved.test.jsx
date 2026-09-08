import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SavedPage from "../src/pages/SavedPage";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { fetchUserData } from "../src/services/userAPI";

vi.mock("../src/services/userAPI", () => ({
  fetchUserData: vi.fn(),
}));

vi.mock("../src/services/cryptoAPI", () => ({
  fetchCryptoDetailsDatabase: vi.fn(),
}));

describe("Saved Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user saved - without items", async () => {
    fetchUserData.mockResolvedValue({
      fullName: "Tiffany Cheng",
      email: "Tiffany@gmail.com",
      savedPrompts: [],
      wallet: [],
      watchlist: [],
    });

    render(
      <MemoryRouter>
        <SavedPage />
      </MemoryRouter>
    );

    await waitFor(async () => {
      screen.debug();

      expect(screen.getByText("Saved Prompts")).to.exist; // title

      // empty page interface
      expect(screen.getByText("No saved prompts yet")).to.exist;
      const addToSavedButton = screen.getByRole("button", {
        name: /Save Your First Prompt/i,
      }); // checks if button exists
      expect(addToSavedButton).toBeInTheDocument();

      // check button clicked action - add modal
      await fireEvent.click(addToSavedButton); //that it would trigger a modal then how do i check that??
      expect(screen.getByRole("heading", { name: /Save Prompt/i })).to.exist;
      expect(screen.getByText(/Prompt Text/i)).to.exist;
      const maybeInput = screen.queryByPlaceholderText(
        /Enter your prompt here.../i
      );
      expect(maybeInput).not.toBeNull();
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      const allSaveButtons = screen.getAllByRole("button", { name: /Save Prompt/i });
      const saveButton = allSaveButtons.find(
        (btn) => btn.textContent === "Save Prompt"
      );
      expect(cancelButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();

      // check if modal can be closed
      await fireEvent.click(cancelButton);
      expect(screen.queryByTestId("add-modal")).to.be.null;
    });
  });

  it("renders user saved - with items", async () => {
    fetchUserData.mockResolvedValue({
      fullName: "Tiffany Cheng",
      email: "Tiffany@gmail.com",
      savedPrompts: [
        { prompt: "first", _id: "68054493a022cb1739dd5733" },
        { prompt: "second", _id: "68054497a022cb1739dd574c" },
      ],
      wallet: [],
      watchlist: [],
    });

    render(
      <MemoryRouter>
        <SavedPage />
      </MemoryRouter>
    );

    await waitFor(async () => {
      expect(screen.getByText("Saved Prompts")).to.exist; // title

      // page interface
      expect(screen.getByText("Prompt")).to.exist;
      const addPromptButton = screen.getByRole("button", {
        name: /Add New Prompt/i,
      }); // button exists when saved is not empty
      expect(addPromptButton).toBeInTheDocument();
    });
  });
});
