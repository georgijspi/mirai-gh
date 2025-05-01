import { render, screen } from "@testing-library/react";
import APIModuleConfigPage from "../../pages/APIModuleConfigPage";

jest.mock("../../components/APIModuleConfig.js", () => {
  return function MockAPIModuleConfig() {
    return (
      <div data-testid="api-module-config">Mock APIModuleConfig Component</div>
    );
  };
});

describe("APIModuleConfigPage", () => {
  const renderAPIModuleConfigPage = () => {
    return render(<APIModuleConfigPage />);
  };

  test("renders the page container with correct styling", () => {
    renderAPIModuleConfigPage();

    const container = screen.getByTestId("api-module-config-page");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("container", "mx-auto");
  });

  test("renders the APIModuleConfig component", () => {
    renderAPIModuleConfigPage();

    expect(screen.getByTestId("api-module-config")).toBeInTheDocument();
  });
});
