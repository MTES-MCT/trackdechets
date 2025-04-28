import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { Formik } from "formik";
import {
  BsdaPackagingInput,
  BsdaPackagingType,
  PackagingInfoInput,
  Packagings
} from "@td/codegen-ui";
import FormikPackagingList from "./FormikPackagingList";
import RhfPackagingList from "./RhfPackagingList";
import { useForm, FormProvider } from "react-hook-form";
import { bsdaPackagingTypes, bsddPackagingTypes } from "./helpers";

type AnyPackagingInput = PackagingInfoInput | BsdaPackagingInput;

describe("<PackagingList />", () => {
  const defaulValues: {
    packagings: AnyPackagingInput[];
  } = {
    packagings: [{ type: Packagings.Fut, quantity: 2 }]
  };

  function renderFormikPackagingList<
    P extends AnyPackagingInput
  >(initialValues?: { packagings: P[] }) {
    render(
      <Formik
        initialValues={initialValues ?? defaulValues}
        onSubmit={jest.fn()}
      >
        <FormikPackagingList
          fieldName="packagings"
          packagingTypes={[...bsddPackagingTypes, ...bsdaPackagingTypes]}
        />
      </Formik>
    );
  }

  function renderRhfPackagingList<P extends AnyPackagingInput>(initialValues?: {
    packagings: P[];
  }) {
    function Component() {
      const methods = useForm({ defaultValues: initialValues ?? defaulValues });

      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(jest.fn())}>
            <RhfPackagingList
              fieldName="packagings"
              packagingTypes={[...bsddPackagingTypes, ...bsdaPackagingTypes]}
            />
          </form>
        </FormProvider>
      );
    }

    render(<Component />);
  }

  type Component = "FormikPackagingList" | "RhfPackagingList";
  const components: Component[] = ["FormikPackagingList", "RhfPackagingList"];

  const renderComponent = (
    component: Component,
    initialValues?: {
      packagings: AnyPackagingInput[];
    }
  ) => {
    return component === "FormikPackagingList"
      ? renderFormikPackagingList(initialValues)
      : renderRhfPackagingList(initialValues);
  };

  it.each<Component>(components)(
    "[%p] should render correctly with one packaging",
    component => {
      renderComponent(component);
      expect(screen.getByDisplayValue("Fût")).toBeInTheDocument();
    }
  );

  it.each<Component>(components)(
    "[%p] should add a new packaging when 'Ajouter un conditionnement' button is clicked",
    async component => {
      renderComponent(component);
      expect(screen.getAllByLabelText("Type").length).toEqual(1);
      // On ne peut pas supprimer le conditionnement quand il n'y en a qu'un
      expect(screen.queryByText("Supprimer")).not.toBeInTheDocument();
      const addButton = screen.getByText("Ajouter un conditionnement");
      fireEvent.click(addButton);
      await waitFor(() =>
        expect(screen.getAllByLabelText("Type").length).toEqual(2)
      );
    }
  );

  it.each<Component>(components)(
    "[%p] should be possible to select Citerne or Benne as long as there" +
      " is only one packaging type",
    async component => {
      renderComponent(component);
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

  it.each<Component>(components)(
    "[%p] Button 'Ajouter un conditionnement' should not be present when Citerne is selected",
    async component => {
      renderComponent(component);
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
    }
  );

  it.each<Component>(components)(
    "[%p] Button 'Ajouter un conditionnement' should be disabled when Benne is selected",
    async component => {
      renderComponent(component);
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
    }
  );

  it.each([
    Packagings.Grv,
    Packagings.Fut,
    Packagings.Citerne,
    Packagings.Autre,
    BsdaPackagingType.BigBag,
    BsdaPackagingType.ConteneurBag,
    BsdaPackagingType.DepotBag,
    BsdaPackagingType.Other,
    BsdaPackagingType.PaletteFilme,
    BsdaPackagingType.SacRenforce
  ])(
    "[FormikPackagingList] should display unit in litres when packaging type is %p",
    async packagingType => {
      renderFormikPackagingList({
        packagings: [{ type: packagingType, quantity: 1, volume: 1 }]
      });
      expect(
        screen.getByText(`Volume en litres (optionnel)`)
      ).toBeInTheDocument();
      expect(screen.getByText(`Soit 0.001 m3`)).toBeInTheDocument();
    }
  );

  it.each([
    Packagings.Grv,
    Packagings.Fut,
    Packagings.Citerne,
    Packagings.Autre,
    BsdaPackagingType.BigBag,
    BsdaPackagingType.ConteneurBag,
    BsdaPackagingType.DepotBag,
    BsdaPackagingType.Other,
    BsdaPackagingType.PaletteFilme,
    BsdaPackagingType.SacRenforce
  ])(
    "[RhfPackagingList] should display unit in litres when packaging type is %p",
    async packagingType => {
      renderRhfPackagingList({
        packagings: [{ type: packagingType, quantity: 1, volume: 1 }]
      });
      expect(
        screen.getByText(`Volume en litres (optionnel)`)
      ).toBeInTheDocument();
      expect(screen.getByText(`Soit 0.001 m3`)).toBeInTheDocument();
    }
  );

  it.each<Component>(components)(
    "[%p] should convert volume from litres to m3  when packaging type is benne",
    async component => {
      renderComponent(component, {
        packagings: [
          {
            type: Packagings.Benne,
            quantity: 1,
            // le volume reçu est en litres
            volume: 1000
          }
        ]
      });
      // L'affichage doit se faire en m3
      const volumeInputInM3 = screen.getByLabelText("Volume en m3 (optionnel)");
      expect(volumeInputInM3).toBeInTheDocument();
      expect(volumeInputInM3).toHaveValue(1);
      expect(screen.getByText(`Soit 1000 litres`)).toBeInTheDocument();
    }
  );

  it.each<Component>(components)(
    "[%p] should remove a packaging when 'Supprimer' button is clicked",
    async component => {
      const grvId = "GRV123";

      renderComponent(component, {
        packagings: [
          { type: Packagings.Fut, quantity: 2 },
          {
            type: Packagings.Grv,
            quantity: 1,
            identificationNumbers: [grvId]
          }
        ]
      });
      expect(screen.getByText(grvId)).toBeInTheDocument();
      const deleteButtons = screen.getAllByText("Supprimer");
      expect(deleteButtons).toHaveLength(2);
      fireEvent.click(deleteButtons[1]);
      await waitFor(() => {
        expect(screen.queryByText(grvId)).not.toBeInTheDocument();
      });
    }
  );

  it.each<Component>(components)(
    "[%p] should display input 'Nom du type de conditionnement' when Type 'Autre' (BSDD) is selected",
    async component => {
      renderComponent(component, {
        packagings: [{ type: Packagings.Autre, quantity: 1 }]
      });
      expect(
        screen.getByLabelText("Nom du type de conditionnement")
      ).toBeInTheDocument();
    }
  );

  it.each<Component>(components)(
    "[%p] should display input 'Nom du type de conditionnement' when Type 'Other' (BSDA) is selected",
    async component => {
      renderComponent(component, {
        packagings: [{ type: BsdaPackagingType.Other, quantity: 1 }]
      });
      expect(
        screen.getByLabelText("Nom du type de conditionnement")
      ).toBeInTheDocument();
    }
  );

  it.each<Component>(components)(
    "[%p] should display identification numbers",
    async component => {
      renderComponent(component, {
        packagings: [
          {
            type: Packagings.Fut,
            quantity: 2,
            identificationNumbers: ["identifiant1", "identifiant2"]
          }
        ]
      });
      expect(screen.getByText("identifiant1")).toBeInTheDocument();
      expect(screen.getByText("identifiant2")).toBeInTheDocument();
      expect(
        screen.getByText("Vous avez saisi 2 numéros pour 2 contenants")
      ).toBeInTheDocument();
    }
  );
});
