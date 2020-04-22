import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

// mock old browser detection
jest.mock("./supportedBrowsers", () => ({
  test: jest.fn(() => true),
}));

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
