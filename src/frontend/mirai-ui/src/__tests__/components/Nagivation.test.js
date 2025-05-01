import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Navigation from "../../components/Navigation";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Create a basic theme for the tests
const theme = createTheme();

// Wrap component with necessary providers
const renderWithProviders = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("Navigation Component", () => {
  const mockOnChangeTab = jest.fn();
  const mockOnToggleApiTest = jest.fn();

  beforeEach(() => {
    // Clear mock function calls before each test
    mockOnChangeTab.mockClear();
    mockOnToggleApiTest.mockClear();
  });

  test("renders navigation with all main menu items", () => {
    renderWithProviders(
      <Navigation
        activeTab="ChatNow"
        onChangeTab={mockOnChangeTab}
        apiTestActive={false}
        onToggleApiTest={mockOnToggleApiTest}
      />
    );

    // Check if main navigation items are present
    expect(screen.getByText("Chat Now")).toBeInTheDocument();
    expect(screen.getByText("Conversations")).toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  test("handles tab changes correctly", () => {
    renderWithProviders(
      <Navigation
        activeTab="ChatNow"
        onChangeTab={mockOnChangeTab}
        apiTestActive={false}
        onToggleApiTest={mockOnToggleApiTest}
      />
    );

    // Click on Conversations tab
    fireEvent.click(screen.getByText("Conversations"));
    expect(mockOnChangeTab).toHaveBeenCalledWith("Conversations");

    // Click on Statistics tab
    fireEvent.click(screen.getByText("Statistics"));
    expect(mockOnChangeTab).toHaveBeenCalledWith("Statistics");
  });

  test("highlights active tab correctly", () => {
    renderWithProviders(
      <Navigation
        activeTab="ChatNow"
        onChangeTab={mockOnChangeTab}
        apiTestActive={false}
        onToggleApiTest={mockOnToggleApiTest}
      />
    );

    // Find the ListItemButton containing "Chat Now" text
    const chatNowButton = screen.getByRole("button", { name: /chat now/i });
    expect(chatNowButton).toHaveClass("Mui-selected");

    // Find the ListItemButton containing "Conversations" text
    const conversationsButton = screen.getByRole("button", {
      name: /conversations/i,
    });
    expect(conversationsButton).not.toHaveClass("Mui-selected");
  });
});
