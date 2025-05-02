import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "../../components/Settings";
import {
  getPicovoiceAccessKey,
  setPicovoiceAccessKey,
} from "../../services/settingsService";

jest.mock("../../services/settingsService", () => ({
  getPicovoiceAccessKey: jest.fn(),
  setPicovoiceAccessKey: jest.fn(),
}));

describe("Settings Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPicovoiceAccessKey.mockResolvedValue("test-key");
  });

  test("renders settings form correctly", async () => {
    render(<Settings />);

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

    await waitFor(() => {
      const input = screen.getByLabelText(/Picovoice Access Key/i);
      expect(input.value).toBe("test-key");
    });
  });

  test("handles save action correctly", async () => {
    setPicovoiceAccessKey.mockResolvedValue();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Picovoice Access Key/i).value).toBe(
        "test-key"
      );
    });

    const input = screen.getByLabelText(/Picovoice Access Key/i);
    fireEvent.change(input, { target: { value: "new-test-key" } });

    const saveButton = screen.getByRole("button", { name: /save access key/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(setPicovoiceAccessKey).toHaveBeenCalledWith("new-test-key");
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Settings saved successfully/i)
      ).toBeInTheDocument();
    });
  });

  test("handles error states correctly", async () => {
    getPicovoiceAccessKey.mockRejectedValue(new Error("Failed to load"));

    render(<Settings />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load access key from server/i)
      ).toBeInTheDocument();
    });
  });

  test("toggles password visibility", async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/Picovoice Access Key/i)
      ).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/Picovoice Access Key/i);
    const toggleButton = screen.getByRole("button", {
      name: /toggle password visibility/i,
    });

    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute("type", "password");
  });
});
