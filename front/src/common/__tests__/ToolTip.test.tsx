import React from "react";
import Tooltip from "common/components/Tooltip";
import { render, fireEvent, act } from "@testing-library/react";
import { LEAVE_TIMEOUT, MOUSE_REST_TIMEOUT } from "@reach/tooltip";
describe("<Tooltip />", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  it("renders nothing when props are empty", () => {
    const { container } = render(<Tooltip />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("shows help message when button is hovered", async () => {
    const helpMsg = "lorem";

    const { container, queryByText, getByRole, getAllByText } = render(
      <Tooltip msg={helpMsg} />
    );

    expect(container.querySelector("button")).toHaveClass("tdTooltip");

    expect(queryByText(helpMsg)).not.toBeInTheDocument();
    const button = getByRole("button");
    expect(button).toHaveClass("tdTooltip");

    // The icon should be rendered as svg
    const svg = container.querySelector("svg");
    expect(button).toContainElement(svg);
    expect(queryByText(helpMsg)).not.toBeInTheDocument();

    // Mouseover button -> display text
    act(() => {
      fireEvent.mouseOver(button);
      jest.advanceTimersByTime(MOUSE_REST_TIMEOUT);
    });
    expect(getAllByText(helpMsg)[0]).toBeInTheDocument();

    // Mouseleave button -> hide text
    act(() => {
      fireEvent.mouseLeave(button);
      jest.advanceTimersByTime(LEAVE_TIMEOUT);
    });

    expect(queryByText(helpMsg)).not.toBeInTheDocument();
  });
});
