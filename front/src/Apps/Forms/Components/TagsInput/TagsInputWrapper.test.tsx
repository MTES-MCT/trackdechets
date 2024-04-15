import React from "react";
import { Formik } from "formik";
import { fireEvent, render, screen } from "@testing-library/react";
import TagsInputWrapper from "./TagsInputWrapper";

describe("<TagsInput/> ", () => {
  const component = () => (
    <Formik initialValues={{ plates: [] }} onSubmit={jest.fn()}>
      <TagsInputWrapper
        fieldName="plates"
        label="Immatriculations"
        maxTags={2}
      />
    </Formik>
  );

  test("component without errors", () => {
    const { container } = render(component());
    expect(container).toBeTruthy();
  });

  test("clicking button should add tags until maxTags", () => {
    render(component());
    const plate1 = "AD-008-BG";
    const plate2 = "AD-009-BG";
    let plateInput = screen.getByLabelText("Immatriculations");
    fireEvent.focus(plateInput);
    fireEvent.change(plateInput, { target: { value: plate1 } });
    let addButton = screen.getByText("Ajouter");
    fireEvent.click(addButton);

    let buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("Ajouter");

    // Les tags sont rendus comme des boutons
    expect(buttons[1]).toHaveTextContent(plate1);

    // vérifie que la valeur de l'input est bien vidée entre deux ajouts
    plateInput = screen.getByLabelText("Immatriculations");
    expect(plateInput).toHaveValue("");
    fireEvent.focus(plateInput);
    fireEvent.change(plateInput, { target: { value: plate2 } });
    fireEvent.click(addButton);

    buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[2]).toHaveTextContent(plate2);

    // Vérifie que le bouton est disabled lorsque le nombre de tags est
    // supérieur ou égal à maxTags=2
    addButton = screen.getByText("Ajouter");
    expect(addButton).toBeDisabled();

    // Supprime le dernier tag
    fireEvent.click(buttons[2]);
    buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);

    // Vérifie que le bouton Ajouter est de nouveau enabled
    addButton = screen.getByText("Ajouter");
    expect(addButton).toBeEnabled();
  });
});
