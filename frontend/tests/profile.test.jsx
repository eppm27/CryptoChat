import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ProfilePage from "../src/pages/ProfilePage";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../src/services/userAPI", () => ({
  fetchUserData: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock("../src/components/CreateTables.jsx", () => ({
  __esModule: true,
  default: () => <div>Mocked CreateTables</div>,
}));

// --- Mock user ---
const mockUser = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders user data after fetching", async () => {
    const { fetchUserData } = await import("../src/services/userAPI");
    fetchUserData.mockResolvedValue(mockUser);

    render(<ProfilePage />);

    expect(
      document.querySelectorAll(".MuiSkeleton-root").length
    ).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("Mocked CreateTables")).toBeInTheDocument();
    });
  });

  it("handles errors when fetching user data", async () => {
    const { fetchUserData } = await import("../src/services/userAPI");
    fetchUserData.mockRejectedValue(new Error("Failed to fetch user data"));

    render(<ProfilePage />);

    expect(
      document.querySelectorAll(".MuiSkeleton-root").length
    ).toBeGreaterThan(0);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching user data:",
        expect.any(Error)
      );
    });
  });

  it("navigates to the edit profile page when the edit button is clicked", async () => {
    const { fetchUserData } = await import("../src/services/userAPI");
    fetchUserData.mockResolvedValue(mockUser);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit Profile"));

    expect(mockNavigate).toHaveBeenCalledWith("/editProfile");
  });

  it("logs out the user and navigates to the home page", async () => {
    const { fetchUserData, logoutUser } = await import(
      "../src/services/userAPI"
    );
    fetchUserData.mockResolvedValue(mockUser);
    logoutUser.mockResolvedValue();

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("handles errors during logout", async () => {
    const { fetchUserData, logoutUser } = await import(
      "../src/services/userAPI"
    );
    fetchUserData.mockResolvedValue(mockUser);
    logoutUser.mockRejectedValue(new Error("Logout failed"));

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalledTimes(1);
    });

    expect(console.error).toHaveBeenCalledWith(
      "Logout failed:",
      expect.any(Error)
    );
  });
});
