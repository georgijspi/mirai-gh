import { render, screen } from "@testing-library/react";
import GlobalChatPage from "../../pages/GlobalChatPage";

jest.mock("../../components/GlobalChat.js", () => {
  return function MockGlobalChat(props) {
    return (
      <div data-testid="global-chat" {...props}>
        Mock GlobalChat Component
      </div>
    );
  };
});

describe("GlobalChatPage", () => {
  const defaultConfig = {
    keywordModel: "Alexa",
    leopardModelPublicPath: "/models/leopard_params.pv",
    porcupineModelPublicPath: "/models/porcupine_params.pv",
    accessKey: "",
    useCustomKeyword: false,
    customKeywordModelPath: "",
  };

  const renderGlobalChatPage = (props = {}) => {
    return render(<GlobalChatPage config={defaultConfig} {...props} />);
  };

  test("renders the GlobalChat component with config", () => {
    renderGlobalChatPage();

    const globalChat = screen.getByTestId("global-chat");
    expect(globalChat).toBeInTheDocument();
  });

  test("passes config prop to GlobalChat component", () => {
    const testConfig = {
      keywordModel: "Alexa",
      leopardModelPublicPath: "/models/leopard_params.pv",
      porcupineModelPublicPath: "/models/porcupine_params.pv",
      accessKey: "",
      useCustomKeyword: false,
      customKeywordModelPath: "",
    };

    renderGlobalChatPage({ config: testConfig });

    const globalChat = screen.getByTestId("global-chat");
    expect(globalChat).toHaveAttribute(
      "data-config",
      JSON.stringify(testConfig)
    );
  });
});
