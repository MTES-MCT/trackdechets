import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// mock old browser detection
jest.mock("./supportedBrowsers", () => ({
  test: jest.fn(() => true),
}));

it("renders without crashing", () => {
  const div = document.createElement("div");

  const root = createRoot(div);
  root.render(<App />);

  root.unmount();
});
