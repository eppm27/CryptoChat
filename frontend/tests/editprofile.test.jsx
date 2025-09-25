import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, beforeEach, it, expect } from "vitest";
import EditProfile from "../src/pages/EditProfile";
import { fetchUserData, updateUserInfo } from "../src/services/userAPI";

vi.mock("../src/services/userAPI", () => ({
  fetchUserData: vi.fn(),
  updateUserInfo: vi.fn(),
}));

vi.mock("antd", () => ({
  message: {
    success: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("EditProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates user info when Save Changes is clicked", async () => {
    fetchUserData.mockResolvedValueOnce({
      firstName: "John",
      lastName: "Doe",
    });

    updateUserInfo.mockResolvedValueOnce("Profile updated successfully");

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue("John")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    });

    // Update the first name
    fireEvent.change(screen.getByDisplayValue("John"), {
      target: { value: "Jane" },
    });

    // Click Save Changes
    fireEvent.click(screen.getByText("Save Changes"));

    // Wait for the updateUserInfo API call
    await waitFor(() => {
      expect(updateUserInfo).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Doe",
        pfp: expect.any(String),
      });
    });
  });

  it("navigates back to profile when Cancel is clicked", async () => {
    fetchUserData.mockResolvedValueOnce({
      firstName: "John",
      lastName: "Doe",
    });

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    });

    // Click Cancel
    fireEvent.click(screen.getByText("Cancel"));

    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });
});
