import { render, screen, waitFor } from "@testing-library/react";
import AgentConfigurationPage from "../../pages/AgentConfigurationPage";

jest.mock("../../components/agent/AgentConfiguration.js", () => {
  return function MockAgentConfiguration() {
    return (
      <div data-testid="agent-configuration">
        Mock Agent Configuration Component
      </div>
    );
  };
});

describe("AgentConfigurationPage", () => {
  const renderAgentConfigurationPage = () => {
    return render(<AgentConfigurationPage />);
  };

  test("renders the page container with correct styling", () => {
    renderAgentConfigurationPage();

    const container = screen.getByTestId("agent-config-page");
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({
      width: "100%",
      minHeight: "calc(100vh - 64px)",
      overflowX: "hidden",
    });
  });

  test("renders the AgentConfiguration component", () => {
    renderAgentConfigurationPage();

    expect(screen.getByTestId("agent-configuration")).toBeInTheDocument();
  });
});
