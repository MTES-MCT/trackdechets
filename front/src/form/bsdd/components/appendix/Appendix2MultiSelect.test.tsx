import React from "react";

import { InitialFormFraction, Form } from "@td/codegen-ui";
import { Formik } from "formik";
import Appendix2MultiSelect from "./Appendix2MultiSelect";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Exemple de retour de la query `appendixForms`
const appendixForms = [
  {
    __typename: "Form",
    id: "cm3h52nk70002ftxsnedbcz1l",
    readableId: "BSD-20241114-FBB5364K6",
    emitter: {
      __typename: "Emitter",
      company: {
        __typename: "FormCompany",
        name: "CODE EN STOCK",
        orgId: "85001946400021"
      }
    },
    wasteDetails: {
      __typename: "WasteDetails",
      code: "07 01 01*",
      name: "eaux de lavage",
      quantity: 1,
      packagingInfos: [
        {
          __typename: "PackagingInfo",
          type: "BENNE",
          other: "",
          quantity: 1,
          volume: null,
          identificationNumbers: []
        }
      ]
    },
    signedAt: "2024-11-14T00:00:00.000Z",
    quantityReceived: 1,
    quantityAccepted: 1,
    quantityRefused: 0,
    quantityGrouped: 0.6,
    processingOperationDone: "D 13",
    recipient: {
      __typename: "Recipient",
      cap: "cap"
    }
  },
  {
    __typename: "Form",
    id: "cm3hhbmrw000ora3ei689lqd2",
    readableId: "BSD-20241114-41RTX259Q",
    emitter: {
      __typename: "Emitter",
      company: {
        __typename: "FormCompany",
        name: "CODE EN STOCK",
        orgId: "85001946400021"
      }
    },
    wasteDetails: {
      __typename: "WasteDetails",
      code: "07 01 01*",
      name: "eaux de lavage",
      quantity: 1,
      packagingInfos: [
        {
          __typename: "PackagingInfo",
          type: "GRV",
          other: "",
          quantity: 1,
          volume: null,
          identificationNumbers: []
        }
      ]
    },
    signedAt: "2024-11-14T00:00:00.000Z",
    quantityReceived: 1,
    quantityAccepted: 1,
    quantityRefused: 0,
    quantityGrouped: 0,
    processingOperationDone: "D 13",
    recipient: {
      __typename: "Recipient",
      cap: "cap"
    }
  }
];

// Exemple de valeur initiale pour `grouping`
const grouping = [
  {
    __typename: "InitialFormFraction",
    quantity: 0.2,
    form: {
      __typename: "InitialForm",
      id: "cm3hh2m7y000ara3ez9bc0qjd",
      readableId: "BSD-20241114-2Z6F1PQ20",
      status: "AWAITING_GROUP",
      wasteDetails: {
        __typename: "WasteDetails",
        code: "07 01 01*",
        name: "eaux de lavage",
        quantity: 1,
        packagingInfos: [
          {
            __typename: "PackagingInfo",
            type: "BENNE",
            other: "",
            quantity: 1,
            volume: null,
            identificationNumbers: []
          }
        ]
      },
      emitter: {
        __typename: "Emitter",
        company: {
          __typename: "FormCompany",
          name: "CODE EN STOCK",
          orgId: "85001946400021"
        },
        isPrivateIndividual: false
      },
      transporter: {
        __typename: "Transporter",
        company: {
          __typename: "FormCompany",
          orgId: "33902484600034",
          siret: "33902484600034"
        }
      },
      recipient: {
        __typename: "Recipient",
        company: {
          __typename: "FormCompany",
          siret: "49383186100049",
          orgId: "49383186100049"
        }
      },
      signedAt: "2024-11-14T00:00:00.000Z",
      quantityReceived: 1.2,
      quantityAccepted: 1,
      quantityGrouped: 0.2,
      processingOperationDone: "D 13"
    }
  }
];

describe("<Appendix2MultiSelect />", () => {
  const updateTotalQuantity = jest.fn();
  const updatePackagings = jest.fn();

  const component = (
    // Bordereaux candidats au regroupement obtenu à partir
    // de la query `appendixForms`
    appendixForms: Form[],
    // Bordereaux déja regroupés au sein du bordereau de groupement
    grouping: InitialFormFraction[]
  ) => (
    <Formik initialValues={{ grouping }} onSubmit={jest.fn()}>
      <Appendix2MultiSelect
        appendixForms={appendixForms}
        updateTotalQuantity={updateTotalQuantity}
        updatePackagings={updatePackagings}
      />
    </Formik>
  );

  it("should render a warning message if there is no annexe 2 candidate", () => {
    render(component([], []));
    const warningMessage = screen.getByText(
      "Aucun bordereau éligible au regroupement"
    );
    expect(warningMessage).toBeInTheDocument();
  });

  it("should render correctly with data from `grouping` and `appendixForms`", async () => {
    render(
      component(
        appendixForms as any as Form[],
        grouping as any as InitialFormFraction[]
      )
    );
    // Vérifie la présence des headers
    const headers = screen.getAllByRole("columnheader");
    const headerCheckbox = within(headers[0]).getByRole("checkbox");
    // Par défaut aucun bordereau n'est sélectionné
    expect(headerCheckbox).not.toBeChecked();
    expect(headers[1]).toHaveTextContent("Numéro");
    expect(headers[2]).toHaveTextContent("Code déchet");
    expect(headers[3]).toHaveTextContent("Émetteur initial");
    //expect(headers[4]).toHaveTextContent("Date de l'acceptation");
    expect(headers[4]).toHaveTextContent("Opération réalisée");
    expect(headers[5]).toHaveTextContent("Quantité acceptée (en t)");
    expect(headers[6]).toHaveTextContent("Quantité restante (en t)");
    expect(headers[7]).toHaveTextContent("Quantité à regrouper (en t)");

    const rows = screen.getAllByRole("row");

    await waitFor(() =>
      // Sur le premier render les données provenant de state initiale Formik
      // ne sont pas affichées, ce waitFor permet d'attendre que ça le soit
      expect(screen.getByText(grouping[0].form.readableId)).toBeInTheDocument()
    );

    // La première ligne correspondent aux bordereaux déjà annexés
    // à l'ouverture du formulaire (paramètre `grouping`)

    const row1 = within(rows[1]).getAllByRole("cell");
    const checkbox1 = within(row1[0]).getByRole("checkbox");
    // La checkbox est coché par défaut puisque ce bordereau est déjà annexé
    expect(checkbox1).toBeChecked();
    expect(row1[1]).toHaveTextContent(grouping[0].form.readableId);
    expect(row1[2]).toHaveTextContent(grouping[0].form.wasteDetails?.code);
    expect(row1[3]).toHaveTextContent(grouping[0].form.emitter?.company?.name);
    expect(row1[3]).toHaveTextContent(grouping[0].form.emitter?.company?.orgId);
    //expect(row1[4]).toHaveTextContent("14/11/2024");
    expect(row1[4]).toHaveTextContent(grouping[0].form.processingOperationDone);
    expect(row1[5]).toHaveTextContent("1");
    // La quantité déjà regroupée reste disponible puisque c'est groupé
    // sur le bordereau de groupement qui fait l'objet de ce formulaire
    expect(row1[6]).toHaveTextContent("1");
    const input1 = within(row1[7]).getByDisplayValue(
      String(grouping[0].quantity)
    );
    expect(input1).toBeInTheDocument();
    expect(input1).toBeEnabled();

    // Les lignes suivantes correspondent aux bordereaux "candidats"
    // qui ne sont pas encore annexés (paramètre `appendixForms`)

    const row2 = within(rows[2]).getAllByRole("cell");
    const checkbox2 = within(row2[0]).getByRole("checkbox");
    expect(checkbox2).not.toBeChecked();
    expect(row2[1]).toHaveTextContent(appendixForms[0].readableId);
    expect(row2[2]).toHaveTextContent(appendixForms[0].wasteDetails?.code);
    expect(row2[3]).toHaveTextContent(appendixForms[0].emitter?.company?.name);
    expect(row2[3]).toHaveTextContent(appendixForms[0].emitter?.company?.orgId);
    // expect(row2[4]).toHaveTextContent("14/11/2024");
    expect(row2[4]).toHaveTextContent(appendixForms[0].processingOperationDone);
    expect(row2[5]).toHaveTextContent("1");
    // La quantité restante est de 1 - 0.6
    expect(row2[6]).toHaveTextContent("0.4");
    // La valeur de l'input correspond par défaut à la quantité restante
    const input2 = within(row2[7]).getByDisplayValue("0.4");
    expect(input2).toBeInTheDocument();
    // L'input est disabled tant que le bordereau n'est pas sélectionné
    expect(input2).toBeDisabled();

    const row3 = within(rows[3]).getAllByRole("cell");
    const checkbox3 = within(row3[0]).getByRole("checkbox");
    expect(checkbox3).not.toBeChecked();
    expect(row3[1]).toHaveTextContent(appendixForms[1].readableId);
    expect(row3[2]).toHaveTextContent(appendixForms[1].wasteDetails?.code);
    expect(row3[3]).toHaveTextContent(appendixForms[1].emitter?.company?.name);
    expect(row3[3]).toHaveTextContent(appendixForms[1].emitter?.company?.orgId);
    //expect(row3[4]).toHaveTextContent("14/11/2024");
    expect(row3[4]).toHaveTextContent(appendixForms[1].processingOperationDone);
    expect(row3[5]).toHaveTextContent("1");
    expect(row3[6]).toHaveTextContent("1");
    const input3 = within(row3[7]).getByDisplayValue("1");
    expect(input3).toBeInTheDocument();
    expect(input3).toBeDisabled();

    fireEvent.click(checkbox2);
    await waitFor(() => expect(checkbox2).toBeChecked());
    expect(input2).not.toBeDisabled();
    expect(updateTotalQuantity).toHaveBeenCalledWith(0.6);
    expect(updatePackagings).toHaveBeenCalledWith([
      {
        other: "",
        quantity: 2,
        type: "BENNE",
        volume: null,
        identificationNumbers: []
      }
    ]);

    fireEvent.click(checkbox3);
    await waitFor(() => expect(checkbox3).toBeChecked());
    expect(updateTotalQuantity).toHaveBeenCalledWith(1.6);
    expect(updatePackagings).toHaveBeenCalledWith([
      {
        other: "",
        quantity: 2,
        type: "BENNE",
        volume: null,
        identificationNumbers: []
      },
      {
        other: "",
        quantity: 1,
        type: "GRV",
        volume: null,
        identificationNumbers: []
      }
    ]);
    expect(input3).not.toBeDisabled();

    expect(headerCheckbox).toBeChecked();

    const user = userEvent.setup();
    user.type(input2, "1");

    await waitFor(() => expect(input2).toHaveValue(0.41));

    user.clear(input2);
    await waitFor(() => expect(input2).toHaveValue(null));

    user.type(input2, "2");
    await waitFor(() => expect(input2).toHaveValue(2));
    expect(
      within(row2[7]).getByText(
        "Vous ne pouvez pas regrouper une quantité supérieure à la quantité restante"
      )
    ).toBeInTheDocument();

    user.clear(input2);
    user.type(input2, "-1");
    await waitFor(() => expect(input2).toHaveValue(-1));
    expect(
      within(row2[7]).getByText("La quantité doit être un nombre supérieur à 0")
    ).toBeInTheDocument();

    // La checkbox du header permet de tout déselectionner
    fireEvent.click(headerCheckbox);
    await waitFor(() => {
      expect(checkbox1).not.toBeChecked();
      expect(checkbox2).not.toBeChecked();
      expect(checkbox3).not.toBeChecked();
    });

    expect(updateTotalQuantity).toHaveBeenCalledWith(0);
    expect(updatePackagings).toHaveBeenCalledWith([]);

    // Les inputs sont tous disabled et leurs valeurs est reset à
    // la quantité restante disponible
    expect(input1).toBeDisabled();
    expect(input1).toHaveValue(1);

    expect(input2).toBeDisabled();
    expect(input2).toHaveValue(0.4);

    expect(input3).toBeDisabled();
    expect(input3).toHaveValue(1);

    // Si l'on clique à nouveau sur la checkbox du header, tous les
    // bordereaux sont sélectionnés
    fireEvent.click(headerCheckbox);
    await waitFor(() => {
      expect(checkbox1).toBeChecked();
      expect(checkbox2).toBeChecked();
      expect(checkbox3).toBeChecked();
    });
    expect(updateTotalQuantity).toHaveBeenCalledWith(2.4);
    expect(updatePackagings).toHaveBeenCalledWith([
      {
        other: "",
        quantity: 2,
        type: "BENNE",
        volume: null,
        identificationNumbers: []
      },
      {
        other: "",
        quantity: 1,
        type: "GRV",
        volume: null,
        identificationNumbers: []
      }
    ]);

    const readableIfFilter = screen.getByLabelText("Numéro de bordereau");
    expect(readableIfFilter).toBeInTheDocument();

    await user.type(readableIfFilter, appendixForms[0].readableId);
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));

    await user.clear(readableIfFilter);
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(4));
  });
});
