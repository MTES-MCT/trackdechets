import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BsdType, BsffType } from "@td/codegen-ui";
import { RhfDetenteurList } from "./RhfDetenteurList";

jest.mock(
  "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper",
  () => () => <div>Identification de l’entreprise</div>
);

const packaging = {
  id: "packaging-1",
  numero: "CONTENANT-1"
};

function FormWrapper({
  ficheInterventions = [],
  type = BsffType.CollectePetitesQuantites
}: {
  ficheInterventions?: Record<string, unknown>[];
  type?: BsffType;
}) {
  const methods = useForm({
    defaultValues: {
      type,
      packagings: [packaging],
      ficheInterventions
    }
  });

  return (
    <FormProvider {...methods}>
      <RhfDetenteurList fieldName="ficheInterventions" bsdType={BsdType.Bsff} />
    </FormProvider>
  );
}

describe("onglet Détenteur du parcours opérateur", () => {
  it("affiche la fiche, le détenteur, le contact et les contenants", async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    expect(
      await screen.findByRole("textbox", {
        name: /N° de fiche d’intervention/
      })
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Type de détenteur/ }),
      "ASSOCIATION"
    );

    expect(
      screen.getByRole("textbox", {
        name: /registre national des associations/
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Personne à contacter/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Contenants rattachés/ })
    ).toBeInTheDocument();
  });

  it("rend le numéro obligatoire lorsque le toggle est désactivé", async () => {
    render(<FormWrapper />);

    const toggle = await screen.findByRole("checkbox", {
      name: /Équipement exempté de fiche d’intervention/
    });
    const interventionNumber = screen.getByRole("textbox", {
      name: /N° de fiche d’intervention/
    });

    expect(toggle).not.toBeChecked();
    expect(interventionNumber).toBeRequired();
    expect(interventionNumber).toHaveAttribute("aria-required", "true");
  });

  it("conserve un numéro visible et éditable lors des changements du toggle", async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    const toggle = await screen.findByRole("checkbox", {
      name: /Équipement exempté de fiche d’intervention/
    });
    const interventionNumber = screen.getByRole("textbox", {
      name: /N° de fiche d’intervention/
    });

    await user.type(interventionNumber, "FI-42");
    await user.click(toggle);

    expect(interventionNumber).toBeVisible();
    expect(interventionNumber).toBeEnabled();
    expect(interventionNumber).not.toBeRequired();
    expect(interventionNumber).toHaveAttribute("aria-required", "false");
    expect(interventionNumber).toHaveValue("FI-42");

    await user.type(interventionNumber, "-BIS");
    await user.click(toggle);

    expect(interventionNumber).toBeRequired();
    expect(interventionNumber).toHaveValue("FI-42-BIS");
  });

  it("restaure une exemption sauvegardée", async () => {
    render(
      <FormWrapper
        ficheInterventions={[
          {
            ...operatorHolder,
            numero: "",
            isExempted: true,
            packagings: [packaging]
          }
        ]}
      />
    );

    expect(
      await screen.findByRole("checkbox", {
        name: /Équipement exempté de fiche d’intervention/
      })
    ).toBeChecked();
    expect(
      screen.getByRole("textbox", { name: /N° de fiche d’intervention/ })
    ).not.toBeRequired();
  });
});

describe("onglet Détenteur du parcours détenteur", () => {
  it("conserve le formulaire détenteur sans la section fiche d’intervention", async () => {
    render(<FormWrapper type={BsffType.TracerFluide} />);

    expect(
      await screen.findByRole("combobox", { name: /Type de détenteur/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", {
        name: /Équipement exempté de fiche d’intervention/
      })
    ).not.toBeInTheDocument();
  });
});

const operatorHolder = {
  holderType: "ENTREPRISE",
  detenteur: {
    isPrivateIndividual: false,
    company: {
      siret: "11111111111111",
      contact: "Jean Dupont",
      phone: "0102030405",
      mail: "jean@example.com"
    }
  }
};
