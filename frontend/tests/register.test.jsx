import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as userAPI from "../src/services/userAPI";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../src/services/userAPI");
const registerMock = vi.spyOn(userAPI, "registerUser");

import RegisterPage from "../src/pages/RegisterPage";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles successful registration", async () => {
    registerMock.mockResolvedValue({ message: "Registration successful" });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), {
      target: { value: 'Doe' },
    });

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Sign Up"));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: "john@example.com",
        password: "password123",
      });
    });

    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("displays error on failed registration", async () => {
    registerMock.mockRejectedValue(new Error("User already exists"));

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Sign Up"));

    await waitFor(() => {
      expect(screen.getByText("User already exists")).toBeInTheDocument();
    });
  });

  it("renders all input fields and the submit button", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("does not submit when fields are empty", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Sign Up"));

    await waitFor(() => {
      expect(registerMock).not.toHaveBeenCalled();
    });
  });

  // it("shows error when password is too short", async () => {
  //   render(
  //     <MemoryRouter>
  //       <RegisterPage />
  //     </MemoryRouter>
  //   );

  //   // fireEvent.change(screen.getByPlaceholderText("First Name"), {
  //   //   target: { value: "Short" },
  //   // });
  //   // fireEvent.change(screen.getByPlaceholderText("Last Name"), {
  //   //   target: { value: "Pass" },
  //   // });
  //   fireEvent.change(screen.getByPlaceholderText("Full Name"), {
  //     target: { value: "Short Pass" },
  //   });
  //   fireEvent.change(screen.getByPlaceholderText("Email"), {
  //     target: { value: "short@example.com" },
  //   });
  //   fireEvent.change(screen.getByPlaceholderText("Password"), {
  //     target: { value: "123" },
  //   });
  //   fireEvent.click(screen.getByText("Sign Up"));

  //   await waitFor(() => {
  //     expect(screen.getByText(/Please lengthen this text to 6 characters or more/i)).toBeInTheDocument();
  //   });
  // });

  it("navigates to login page when link is clicked", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/log in/i));
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});
