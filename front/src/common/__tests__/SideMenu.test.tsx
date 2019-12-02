import React from "react";
import SideMenu from "../SideMenu";
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/react";

describe("<SideMenu />", () => {
  beforeEach(() => {
    // reset window size
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  it("should render content normally if resolution is > 480", () => {
    const { container } = render(
      <SideMenu>
        <div id="menu-content">Menu Content</div>
      </SideMenu>
    );
    const content = container.querySelector("[id=menu-content]");
    expect(content).toBeInTheDocument();
  });

  it("should render menu icon if resolution is < 480", () => {
    window.innerWidth = 300;
    const { container } = render(
      <SideMenu>
        <div id="menu-content">Menu Content</div>
      </SideMenu>
    );
    const content = container.querySelector("[id=menu-content]");
    expect(content).not.toBeInTheDocument();
    const menu = container.querySelector("svg");
    expect(menu).toBeInTheDocument();
  });
});
