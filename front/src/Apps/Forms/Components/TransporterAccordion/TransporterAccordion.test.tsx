import React from "react";
import { fireEvent, getByTitle, render } from "@testing-library/react";
import { TransporterAccordion } from "./TransporterAccordion";

describe("TransporterAccordion", () => {
  const foldableContent = "Foo";

  afterEach(jest.resetAllMocks);

  const onTransporterAdd = jest.fn();
  const onTransporterDelete = jest.fn();
  const onTransporterShiftUp = jest.fn();
  const onTransporterShiftDown = jest.fn();
  const onExpanded = jest.fn();

  const Component = (
    <TransporterAccordion
      name="Transporteur"
      numero={1}
      expanded={true}
      onTransporterAdd={onTransporterAdd}
      onTransporterDelete={onTransporterDelete}
      onTransporterShiftUp={onTransporterShiftUp}
      onTransporterShiftDown={onTransporterShiftDown}
      onExpanded={onExpanded}
      deleteLabel="Supprimer"
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

  test("clicking the caret should call the `onExpanded` callback`", () => {
    const { container } = render(Component);
    const caretButton = getByTitle(container, "Replier");
    fireEvent.click(caretButton);
    expect(onExpanded).toHaveBeenCalledTimes(1);
  });
});
