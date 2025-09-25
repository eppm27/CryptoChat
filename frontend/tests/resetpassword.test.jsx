import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, beforeEach, it, expect } from "vitest";
import ResetPasswordPage from "../src/pages/ResetPasswordPage";
import axios from "axios";

vi.mock("axios");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({
      userId: "123",
      token: "valid-token",
    }),
  };
});

describe("ResetPasswordPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays an error message for an invalid token", async () => {
    axios.get.mockRejectedValueOnce({
      response: { data: { message: "Invalid or expired token" } },
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired token")).toBeInTheDocument();
    });
  });

  it("renders the reset password form for a valid token", async () => {
    axios.get.mockResolvedValueOnce({
      data: { message: "Token verified" },
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Reset Your Password")).toBeInTheDocument();
    });
  });

  it("displays an error when passwords don't match", async () => {
    axios.get.mockResolvedValueOnce({
      data: { message: "Token verified" },
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Reset Your Password")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "password456" },
    });

    fireEvent.click(screen.getByText("Update Password"));

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
  });

  it("submits the form and updates the password", async () => {
    axios.get.mockResolvedValueOnce({
      data: { message: "Token verified" },
    });

    axios.post.mockResolvedValueOnce({
      data: { message: "Password updated successfully!" },
    });

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Reset Your Password")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("Update Password"));

    await waitFor(() => {
      expect(
        screen.getByText("Password updated successfully! Redirecting to login...")
      ).toBeInTheDocument();
    });
  });
});
