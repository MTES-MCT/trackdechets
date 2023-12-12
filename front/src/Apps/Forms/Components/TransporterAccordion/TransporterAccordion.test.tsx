import React from "react";
import {
  fireEvent,
  getByText,
  getByTitle,
  render
} from "@testing-library/react";
import { TransporterAccordion } from "./TransporterAccordion";

describe("TransporterAccordion", () => {
  const foldableContent = "Foo";

  afterEach(jest.resetAllMocks);

  const onTransporterAdd = jest.fn();
  const onTransporterDelete = jest.fn();
  const onTransporterShiftUp = jest.fn();
  const onTransporterShiftDown = jest.fn();

  const Component = (
    <TransporterAccordion
      name="Transporteur"
      numero={1}
      onTransporterAdd={onTransporterAdd}
      onTransporterDelete={onTransporterDelete}
      onTransporterShiftUp={onTransporterShiftUp}
      onTransporterShiftDown={onTransporterShiftDown}
    >
      {foldableContent}
    </TransporterAccordion>
  );

  it("should renders the component", () => {
    const { container } = render(Component);
    expect(container).toBeTruthy();
  });

  test("clicking the add button should call the `onTransporterAdd callback`", () => {
    const { container } = render(Component);
    const addButton = getByTitle(container, "Ajouter");
    fireEvent.click(addButton);
    expect(onTransporterAdd).toHaveBeenCalledTimes(1);
  });

  test("clicking the delete button should call the `onTransporterDelete` callback", () => {
    const { container } = render(Component);
    const deleteButton = getByTitle(container, "Supprimer");
    fireEvent.click(deleteButton);
    expect(onTransporterDelete).toHaveBeenCalledTimes(1);
  });

  test("clicking the Up button should call the `onTransporterShiftUp` callback`", () => {
    const { container } = render(Component);
    const upButton = getByTitle(container, "Remonter");
    fireEvent.click(upButton);
    expect(onTransporterShiftUp).toHaveBeenCalledTimes(1);
  });

  test("clicking the Up button should call the `onTransporterShiftUp` callback`", () => {
    const { container } = render(Component);
    const downButton = getByTitle(container, "Descendre");
    fireEvent.click(downButton);
    expect(onTransporterShiftDown).toHaveBeenCalledTimes(1);
  });
});
