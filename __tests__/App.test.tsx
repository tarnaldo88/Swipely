import { render } from "@testing-library/react-native";
import App from "../App";

// Mock the store to avoid Redux issues in tests
jest.mock("../src/store", () => ({
  store: {
    getState: () => ({}),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
}));

describe("App Component", () => {
  it("should render without crashing", () => {
    const { getByText } = render(<App />);
    // App now shows loading screen initially, then auth flow
    expect(getByText("Loading...")).toBeTruthy();
  });

  it("should display loading state initially", () => {
    const { getByText } = render(<App />);
    expect(getByText("Loading...")).toBeTruthy();
  });

  it("should render the app structure", () => {
    const { container } = render(<App />);
    // App should render without crashing
    expect(container).toBeTruthy();
  });
});
