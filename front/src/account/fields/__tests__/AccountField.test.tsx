import React from "react";
import AccountField from "../AccountField";
import { render, fireEvent } from "@testing-library/react";
import styles from "../AccountField.module.scss";

describe("<AccountField />", () => {
  it("should render label, value, tooltip and modifier", () => {
    const { container, getByText, queryByRole } = render(
      <AccountField
        name="username"
        label="Nom utilisateur"
        value="John Snow"
        renderForm={() => <form></form>}
        tooltip="Le nom de l'utilisateur"
        modifier="Modifier"
      />
    );

    expect(container.querySelector("div")).toHaveClass(styles.field);

    // it should contain label
    expect(getByText("Nom utilisateur")).toBeInTheDocument();

    // it should contain field value
    expect(getByText("John Snow")).toBeInTheDocument();

    // it should not contain forme
    expect(queryByRole("form")).not.toBeInTheDocument();

    // it should contain modifier;
    expect(getByText("Modifier")).toBeInTheDocument();
  });

  it("should render form when the modifier is clicked", () => {
    const { container, getByText, getByRole, queryByText, queryByRole } =
      render(
        <AccountField
          name="username"
          label="Nom utilisateur"
          value="John Snow"
          renderForm={toggleEdition => (
            <form name="a form" onSubmit={() => toggleEdition()}>
              <button type="submit" data-test-id="submit-button" />
            </form>
          )}
          tooltip="Le nom de l'utilisateur"
          modifier="Modifier"
        />
      );

    const modifier = getByText("Modifier");

    // click the modifier
    fireEvent.click(modifier);

    // it should apply editing style
    expect(container.querySelector("div")).toHaveClass(styles.editing);

    // it should display form
    const form = getByRole("form");
    expect(getByRole("form")).toBeInTheDocument();

    // the value of the modifier should change to "Annuler"
    expect(queryByText("Modifier")).not.toBeInTheDocument();
    expect(getByText("Annuler")).toBeInTheDocument();

    // Submit the form
    fireEvent.submit(form);

    // it should toogle edition
    expect(queryByRole("form")).not.toBeInTheDocument();
    expect(queryByText("Modifier")).toBeInTheDocument();
    expect(getByText("John Snow")).toBeInTheDocument();
  });
});
