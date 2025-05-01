import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Navigation from "../../components/Navigation";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("Navigation Component", () => {
  const mockOnChangeTab = jest.fn();
  const mockOnToggleApiTest = jest.fn();

  beforeEach(() => {
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

    fireEvent.click(screen.getByText("Conversations"));
    expect(mockOnChangeTab).toHaveBeenCalledWith("Conversations");

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

    const chatNowButton = screen.getByRole("button", { name: /chat now/i });
    expect(chatNowButton).toHaveClass("Mui-selected");

    const conversationsButton = screen.getByRole("button", {
      name: /conversations/i,
    });
    expect(conversationsButton).not.toHaveClass("Mui-selected");
  });
});
