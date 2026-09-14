import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { FluidesFrigorigenesView } from "./FluidesFrigorigenes";
import { FluidesFrigorigenesDataState } from "./fluides-frigorigenes/model";
import { fluidesFrigorigenesInterventionsFixture } from "./fluides-frigorigenes/fixtures";

const renderComponent = (dataState?: FluidesFrigorigenesDataState) =>
  render(
    <FluidesFrigorigenesView
      operatorSiret="12345678901234"
      state={dataState ?? { status: "loading" }}
    />
  );

const expectEmptyTables = () => {
  expect(screen.getAllByRole("table")).toHaveLength(2);
  expect(
    screen.getByRole("table", {
      name: "Fiches d'intervention disponibles"
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("table", {
      name: "Fiches d'intervention sélectionnées"
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", {
      name: "Importer les fiches d'interventions"
    })
  ).toBeDisabled();
};

describe("FluidesFrigorigenesBsff", () => {
  it("renders the RG1 error states", () => {
    const { rerender } = renderComponent({ status: "serviceError" });
    expect(screen.getByText("Erreur 500 : API down")).toBeInTheDocument();
    expect(
      screen.getByText(/Connexion à l'API impossible/)
    ).toBeInTheDocument();
    expectEmptyTables();
    rerender(
      <FluidesFrigorigenesView
        operatorSiret="12345678901234"
        state={{ status: "credentialsError" }}
      />
    );
    expect(
      screen.getByText("Erreur de connexion avec les identifiants")
    ).toBeInTheDocument();
    expectEmptyTables();
    rerender(
      <FluidesFrigorigenesView
        operatorSiret="12345678901234"
        state={{ status: "unknownSiret" }}
      />
    );
    expect(screen.getByText("SIRET non reconnu")).toBeInTheDocument();
    expect(screen.getByText(/n'a pas été reconnu/)).toBeInTheDocument();
    expectEmptyTables();
    rerender(
      <FluidesFrigorigenesView
        operatorSiret="12345678901234"
        state={{ status: "success", interventions: [] }}
      />
    );
    expect(screen.getByText("Dataset vide")).toBeInTheDocument();
    expect(screen.getByText(/12345678901234/)).toBeInTheDocument();
    expectEmptyTables();
  });

  it("renders mocked interventions and expands their containers", () => {
    renderComponent({
      status: "success",
      interventions: fluidesFrigorigenesInterventionsFixture
    });
    expect(screen.getByText("FI-2026-001")).toBeInTheDocument();
    expect(screen.queryByText("BOUT-001")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Déplier la fiche FI-2026-001" })
    );
    expect(screen.getByText("BOUT-001")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Replier la fiche FI-2026-001" })
    );
    expect(screen.queryByText("BOUT-001")).not.toBeInTheDocument();
  });

  it("renders every waste code of a mixed intervention", () => {
    renderComponent({
      status: "success",
      interventions: [
        {
          ...fluidesFrigorigenesInterventionsFixture[0],
          wasteCodes: ["14 06 01*", "16 05 04*"],
          containers: [
            fluidesFrigorigenesInterventionsFixture[0].containers[0],
            {
              ...fluidesFrigorigenesInterventionsFixture[0].containers[1],
              wasteCode: "16 05 04*"
            }
          ]
        }
      ]
    });

    expect(screen.getByText("14 06 01*, 16 05 04*")).toBeInTheDocument();
    expect(screen.queryByText("Erreur 500 : API down")).not.toBeInTheDocument();
  });

  it("automatically hides interventions already associated with a BSFF", () => {
    renderComponent({
      status: "success",
      interventions: fluidesFrigorigenesInterventionsFixture
    });
    expect(screen.queryByText("FI-2026-003")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Associé à un bordereau")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Supprimer le filtre Non" })
    ).not.toBeInTheDocument();
  });

  it("displays the selected intervention and enforces then resets RG4 bis", () => {
    renderComponent({
      status: "success",
      interventions: fluidesFrigorigenesInterventionsFixture
    });
    const importButton = screen.getByRole("button", {
      name: "Importer les fiches d'interventions"
    });
    const first = screen.getByRole("button", {
      name: "Ajouter la fiche FI-2026-001"
    });
    const second = screen.getByRole("button", {
      name: "Ajouter la fiche FI-2026-002"
    });
    expect(importButton).toBeDisabled();
    fireEvent.click(second);
    expect(importButton).toBeEnabled();
    expect(first).toBeDisabled();
    const selectedTable = screen.getByRole("table", {
      name: "Fiches d'intervention sélectionnées"
    });
    expect(within(selectedTable).getByText("FI-2026-002")).toBeInTheDocument();
    expect(within(selectedTable).getByText("2026-08-20")).toBeInTheDocument();
    expect(
      within(selectedTable).queryByText("BOUT-003")
    ).not.toBeInTheDocument();
    const availableTable = screen.getByRole("table", {
      name: "Fiches d'intervention disponibles"
    });
    expect(within(availableTable).getByText("Ajouté")).toBeInTheDocument();
    expect(
      within(availableTable).queryByRole("button", {
        name: "Ajouter la fiche FI-2026-002"
      })
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(selectedTable).getByRole("button", {
        name: "Retirer la fiche FI-2026-002"
      })
    );
    expect(importButton).toBeDisabled();
    expect(first).toBeEnabled();
    expect(
      within(availableTable).getByRole("button", {
        name: "Ajouter la fiche FI-2026-002"
      })
    ).toBeEnabled();
  });

  it("displays one row for a selected multi-container intervention", () => {
    renderComponent({
      status: "success",
      interventions: fluidesFrigorigenesInterventionsFixture
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Ajouter la fiche FI-2026-001"
      })
    );
    const table = screen.getByRole("table", {
      name: "Fiches d'intervention sélectionnées"
    });
    expect(within(table).getByText("FI-2026-001")).toBeInTheDocument();
    expect(within(table).getByText("8 kg")).toBeInTheDocument();
    expect(within(table).getByText("2026-08-18")).toBeInTheDocument();
    expect(within(table).queryByText("BOUT-001")).not.toBeInTheDocument();
    expect(within(table).queryByText("BOUT-002")).not.toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(2);
  });
});
