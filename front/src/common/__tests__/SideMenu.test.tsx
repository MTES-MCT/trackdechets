import React from "react";
import SideMenu from "common/components/SideMenu";
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/react";
import { mockMatchMediaWidth } from "common/__mocks__/matchmedia.mock";

describe("<SideMenu />", () => {
  it("should render content normally if resolution is > 1000", () => {
    mockMatchMediaWidth(1001);
    const { container } = render(
      <SideMenu>
        <div id="menu-content">Menu Content</div>
      </SideMenu>
    );
    const content = container.querySelector("[id=menu-content]");
    expect(content).toBeInTheDocument();
  });

  it("should render menu not if resolution is < 1000", () => {
    mockMatchMediaWidth(999);

    const { container } = render(
      <SideMenu>
        <div id="menu-content">Menu Content</div>
      </SideMenu>
    );
    const content = container.querySelector("[id=menu-content]");
    expect(content).not.toBeInTheDocument();
  });
});
