import { render, screen, fireEvent } from "@testing-library/react";
import SettingsPage from "../../pages/SettingsPage";

describe("SettingsPage", () => {
  const defaultConfig = {
    keywordModel: "Alexa",
    accessKey: "",
    leopardModelPublicPath: "",
  };

  const mockOnConfigChange = jest.fn();

  const renderSettingsPage = () => {
    return render(
      <SettingsPage
        config={defaultConfig}
        onConfigChange={mockOnConfigChange}
      />
    );
  };

  test("renders all main tabs", () => {
    renderSettingsPage();

    expect(screen.getByText("Voice Settings")).toBeInTheDocument();
    expect(screen.getByText("Access Keys")).toBeInTheDocument();
    expect(screen.getByText("LLM Configuration")).toBeInTheDocument();
    expect(screen.getByText("Model Management")).toBeInTheDocument();
  });

  test("switches between tabs correctly", () => {
    renderSettingsPage();

    fireEvent.click(screen.getByText("Voice Settings"));
    expect(screen.getByTestId("voice-settings-content")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Access Keys"));
    expect(screen.getByTestId("access-keys-content")).toBeInTheDocument();

    fireEvent.click(screen.getByText("LLM Configuration"));
    expect(screen.getByTestId("llm-config-content")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Model Management"));
    expect(screen.getByTestId("model-management-content")).toBeInTheDocument();
  });

  test("maintains tab state after navigation", () => {
    renderSettingsPage();
    fireEvent.click(screen.getByText("LLM Configuration"));
    window.history.pushState({}, "", "/settings");
    expect(screen.getByTestId("llm-config-content")).toBeInTheDocument();
  });
});
