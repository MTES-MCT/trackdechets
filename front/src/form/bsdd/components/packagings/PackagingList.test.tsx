import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { Formik } from "formik";
import PackagingList from "./PackagingList";
import { PackagingInfoInput, Packagings } from "@td/codegen-ui";

describe("<PackagingList />", () => {
  const defaulValues: { packagings: PackagingInfoInput[] } = {
    packagings: [{ type: Packagings.Fut, quantity: 2 }]
  };

  const renderComponent = (initialValues?: {
    packagings: PackagingInfoInput[];
  }) =>
    render(
      <Formik
        initialValues={initialValues ?? defaulValues}
        onSubmit={jest.fn()}
      >
        <PackagingList fieldName="packagings" />
      </Formik>
    );

  it("should render correctly  with one packaging", () => {
    renderComponent();
    expect(screen.getByDisplayValue("Fût")).toBeInTheDocument();
  });

  it("should add a new packaging when 'Ajouter un conditionnement' button is clicked", async () => {
    renderComponent();
    expect(screen.getAllByLabelText("Type").length).toEqual(1);
    // On ne peut pas supprimer le conditionnement quand il n'y en a qu'un
    expect(screen.queryByText("Supprimer")).not.toBeInTheDocument();
    const addButton = screen.getByText("Ajouter un conditionnement");
    fireEvent.click(addButton);
    await waitFor(() =>
      expect(screen.getAllByLabelText("Type").length).toEqual(2)
    );
  });

  it(
    "should be possible to select Citerne or Benne as long as there" +
      " is only one packaging type",
    async () => {
      renderComponent();
      expect(screen.getByText("Citerne")).toBeInTheDocument();
      expect(screen.getByText("Benne")).toBeInTheDocument();
      const addButton = screen.getByText("Ajouter un conditionnement");
      // On ajoute un deuxième conditionnement
      fireEvent.click(addButton);
      // Il n'est plus possible de choisir Citerne ou Benne
      await waitFor(() => {
        expect(screen.queryByText("Citerne")).not.toBeInTheDocument();
        expect(screen.queryByText("Benne")).not.toBeInTheDocument();
      });
    }
  );

  it("Button 'Ajouter un conditionnement' should not be present when Citerne is selected", async () => {
    renderComponent();
    const dropdown = screen.getByLabelText("Type");
    fireEvent.change(dropdown, { target: { value: Packagings.Citerne } });
    await waitFor(() =>
      expect(
        screen.queryByText("Ajouter un conditionnement")
      ).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          "Un conditionnement en citerne exclut le mélange avec tout autre type de conditionnement"
        )
      ).toBeInTheDocument()
    );
  });

  it("Button 'Ajouter un conditionnement' should be disabled when Benne is selected", async () => {
    renderComponent();
    const dropdown = screen.getByLabelText("Type");
    fireEvent.change(dropdown, { target: { value: Packagings.Benne } });
    await waitFor(() =>
      expect(
        screen.queryByText("Ajouter un conditionnement")
      ).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          "Un conditionnement en benne exclut le mélange avec tout autre type de conditionnement"
        )
      ).toBeInTheDocument()
    );
  });

  it("should display error message when more than 2 citernes", async () => {
    renderComponent();
    const dropdown = screen.getByLabelText("Type");
    fireEvent.change(dropdown, { target: { value: Packagings.Citerne } });
    const quantityInput = screen.getByLabelText("Nombre");
    fireEvent.change(quantityInput, { target: { value: 3 } });
    await waitFor(() =>
      expect(
        screen.getByText("Impossible de saisir plus de 2 citernes")
      ).toBeInTheDocument()
    );
  });

  it("should display error message when more than 3 bennes", async () => {
    renderComponent();
    const dropdown = screen.getByLabelText("Type");
    fireEvent.change(dropdown, { target: { value: Packagings.Benne } });
    const quantityInput = screen.getByLabelText("Nombre");
    fireEvent.change(quantityInput, { target: { value: 3 } });
    await waitFor(() =>
      expect(
        screen.getByText("Impossible de saisir plus de 2 bennes")
      ).toBeInTheDocument()
    );
  });

  it.each([
    Packagings.Grv,
    Packagings.Fut,
    Packagings.Citerne,
    Packagings.Autre
  ])(
    "should display unit in litres when packaging type is %p",
    async packagingType => {
      renderComponent({
        packagings: [{ type: packagingType, quantity: 1, volume: 1 }]
      });
      expect(
        screen.getByText(`Volume en litres (optionnel)`)
      ).toBeInTheDocument();
      expect(screen.getByText(`Soit 0.001000 m3`)).toBeInTheDocument();
    }
  );

  it("should display unit in m3 when packaging type is benne", async () => {
    renderComponent({
      packagings: [{ type: Packagings.Benne, quantity: 1, volume: 1 }]
    });
    expect(screen.getByText(`Volume en m3 (optionnel)`)).toBeInTheDocument();
    expect(screen.getByText(`Soit 1000 litres`)).toBeInTheDocument();
  });

  it("should remove a packaging when 'Supprimer' button is clicked", async () => {
    renderComponent({
      packagings: [
        { type: Packagings.Fut, quantity: 2 },
        { type: Packagings.Grv, quantity: 1 }
      ]
    });
    expect(
      screen.getByDisplayValue("Grand Récipient Vrac (GRV)")
    ).toBeInTheDocument();
    const deleteButtons = screen.getAllByText("Supprimer");
    expect(deleteButtons).toHaveLength(2);
    fireEvent.click(deleteButtons[1]);
    await waitFor(() => {
      expect(
        screen.queryByDisplayValue("Grand Récipient Vrac (GRV)")
      ).not.toBeInTheDocument();
    });
  });

  it("should display input 'Nom du type de contenant' when Type 'Autre' is selected", async () => {
    renderComponent({
      packagings: [{ type: Packagings.Autre, quantity: 1 }]
    });
    expect(
      screen.getByLabelText("Nom du type de contenant")
    ).toBeInTheDocument();
  });
});
