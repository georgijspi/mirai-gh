import { render, screen, fireEvent } from "@testing-library/react";
import STTConfig from "../../../components/stt/STTConfig";

describe("STTConfig", () => {
  const mockSetAccessKey = jest.fn();
  const defaultProps = {
    accessKey: "",
    setAccessKey: mockSetAccessKey,
  };

  const renderSTTConfig = (props = {}) => {
    return render(<STTConfig {...defaultProps} {...props} />);
  };

  test("renders all UI components", () => {
    renderSTTConfig();

    expect(screen.getByTestId("stt-config-container")).toBeInTheDocument();
    expect(
      screen.getByText("Speech-to-Text Configuration")
    ).toBeInTheDocument();
    expect(screen.getByText("Access Key")).toBeInTheDocument();
  });

  test("updates form inputs correctly", () => {
    renderSTTConfig();

    const input = screen.getByPlaceholderText(
      "Enter your Picovoice access key here"
    );
    const testValue = "test-access-key";

    fireEvent.change(input, { target: { value: testValue } });
    expect(mockSetAccessKey).toHaveBeenCalledWith(testValue);
  });

  test("displays error messages appropriately", () => {
    renderSTTConfig();

    const link = screen.getByText("console.picovoice.ai");
    expect(link).toHaveAttribute("href", "https://console.picovoice.ai/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
