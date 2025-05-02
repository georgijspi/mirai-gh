import { render, screen } from "@testing-library/react";
import ConversationsPage from "../../pages/ConversationsPage";

jest.mock("../../components/conversation/Conversations", () => {
  return function MockConversations() {
    return <div data-testid="conversations">Mock Conversations Component</div>;
  };
});

describe("ConversationsPage", () => {
  const renderConversationsPage = () => {
    return render(<ConversationsPage />);
  };

  test("renders the page container with correct styling", () => {
    renderConversationsPage();

    const container = screen.getByTestId("conversations-page");
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({
      height: "100%",
      overflow: "hidden",
    });
  });

  test("renders the Conversations component", () => {
    renderConversationsPage();

    expect(screen.getByTestId("conversations")).toBeInTheDocument();
  });
});
