import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import { vi, describe, it, beforeEach, expect } from "vitest";
import ForgotPasswordPage from "../src/pages/ForgotPasswordPage";

vi.mock("axios");

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the ForgotPasswordPage component", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Forgot Your Password?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
  });

  it("displays an error message when the email field is empty", async () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    const resetButton = screen.getByText("Reset Password");
    fireEvent.click(resetButton);

    expect(await screen.findByText("Please enter your email")).toBeInTheDocument();
    expect(screen.getByText("Please enter your email")).toHaveClass("text-red-500");
  });

  it("sends a reset password request successfully", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "Password reset link sent to your email!" },
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const resetButton = screen.getByText("Reset Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText("Password reset link sent to your email!")).toBeInTheDocument();
    });

    expect(screen.getByText("Password reset link sent to your email!")).toHaveClass("text-green-500");
    expect(axios.post).toHaveBeenCalledWith("/auth/password/reset", { email: "test@example.com" });
  });

  it("handles backend errors when sending a reset password request", async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: "Error sending reset email" } },
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const resetButton = screen.getByText("Reset Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText("Error sending reset email")).toBeInTheDocument();
    });

    expect(screen.getByText("Error sending reset email")).toHaveClass("text-red-500");
    expect(axios.post).toHaveBeenCalledWith("/auth/password/reset", { email: "test@example.com" });
  });
});