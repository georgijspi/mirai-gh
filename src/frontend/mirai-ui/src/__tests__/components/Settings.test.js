import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "../../components/Settings";
import {
  getPicovoiceAccessKey,
  setPicovoiceAccessKey,
} from "../../services/settingsService";

// Mock the service functions
jest.mock("../../services/settingsService", () => ({
  getPicovoiceAccessKey: jest.fn(),
  setPicovoiceAccessKey: jest.fn(),
}));

describe("Settings Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Setup default mock implementation
    getPicovoiceAccessKey.mockResolvedValue("test-key");
  });

  test("renders settings form correctly", async () => {
    render(<Settings />);

    // Check if main elements are present
    expect(screen.getByText("API Access Keys")).toBeInTheDocument();
    expect(screen.getByText("Voice Recognition")).toBeInTheDocument();
    await waitFor(() => {
      const input = screen.getByLabelText(/Picovoice Access Key/i);
      expect(input.value).toBe("test-key");
    });
    expect(
      screen.getByRole("button", { name: /save access key/i })
    ).toBeInTheDocument();
  });

  test("loads and displays existing access key", async () => {
    render(<Settings />);

    // Wait for the access key to be loaded and displayed
    await waitFor(() => {
      const input = screen.getByLabelText(/Picovoice Access Key/i);
      expect(input.value).toBe("test-key");
    });
  });

  test("handles save action correctly", async () => {
    setPicovoiceAccessKey.mockResolvedValue();
    render(<Settings />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText(/Picovoice Access Key/i).value).toBe(
        "test-key"
      );
    });

    // Change the input value
    const input = screen.getByLabelText(/Picovoice Access Key/i);
    fireEvent.change(input, { target: { value: "new-test-key" } });

    // Click save button
    const saveButton = screen.getByRole("button", { name: /save access key/i });
    fireEvent.click(saveButton);

    // Verify save was called with new value
    await waitFor(() => {
      expect(setPicovoiceAccessKey).toHaveBeenCalledWith("new-test-key");
    });

    // Check for success message
    await waitFor(() => {
      expect(
        screen.getByText(/Settings saved successfully/i)
      ).toBeInTheDocument();
    });
  });

  test("handles error states correctly", async () => {
    // Mock the API to throw an error
    getPicovoiceAccessKey.mockRejectedValue(new Error("Failed to load"));

    render(<Settings />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load access key from server/i)
      ).toBeInTheDocument();
    });
  });

  test("toggles password visibility", async () => {
    render(<Settings />);

    // Wait for the component to load
    await waitFor(() => {
      expect(
        screen.getByLabelText(/Picovoice Access Key/i)
      ).toBeInTheDocument();
    });

    // Get the password input and toggle button
    const input = screen.getByLabelText(/Picovoice Access Key/i);
    const toggleButton = screen.getByRole("button", {
      name: /toggle password visibility/i,
    });

    // Initially password should be hidden
    expect(input).toHaveAttribute("type", "password");

    // Click toggle button
    fireEvent.click(toggleButton);

    // Password should be visible
    expect(input).toHaveAttribute("type", "text");

    // Click toggle button again
    fireEvent.click(toggleButton);

    // Password should be hidden again
    expect(input).toHaveAttribute("type", "password");
  });
});
