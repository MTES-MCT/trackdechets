import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import FluidesFrigorigenesBsff from "./FluidesFrigorigenes";
import { FluidesFrigorigenesDataState } from "./fluides-frigorigenes/model";
import { mockFluidesFrigorigenesInterventions } from "./fluides-frigorigenes/mockData";

function Wrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm({
    defaultValues: { emitter: { company: { siret: "12345678901234" } } }
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}
const renderComponent = (dataState?: FluidesFrigorigenesDataState) =>
  render(
    <Wrapper>
      <FluidesFrigorigenesBsff dataState={dataState} />
    </Wrapper>
  );

describe("FluidesFrigorigenesBsff", () => {
  it("renders service, unknown SIRET and empty dataset states", () => {
    const { rerender } = renderComponent({ status: "serviceError" });
    expect(
      screen.getByText(/Connexion à l'API impossible/)
    ).toBeInTheDocument();
    rerender(
      <Wrapper>
        <FluidesFrigorigenesBsff dataState={{ status: "unknownSiret" }} />
      </Wrapper>
    );
    expect(screen.getByText(/n'a pas été reconnu/)).toBeInTheDocument();
    rerender(
      <Wrapper>
        <FluidesFrigorigenesBsff
          dataState={{ status: "success", interventions: [] }}
        />
      </Wrapper>
    );
    expect(screen.getByText(/12345678901234/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders mocked interventions and expands their containers", () => {
    renderComponent({
      status: "success",
      interventions: mockFluidesFrigorigenesInterventions
    });
    expect(screen.getByText("FI-2026-001")).toBeInTheDocument();
    expect(screen.queryByText("Bouteille BOUT-001")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Déplier la fiche FI-2026-001" })
    );
    expect(screen.getByText("Bouteille BOUT-001")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Replier la fiche FI-2026-001" })
    );
    expect(screen.queryByText("Bouteille BOUT-001")).not.toBeInTheDocument();
  });

  it("removes the default association filter tag", () => {
    renderComponent({
      status: "success",
      interventions: mockFluidesFrigorigenesInterventions
    });
    expect(screen.queryByText("FI-2026-003")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer le filtre Non" })
    );
    expect(screen.getByText("FI-2026-003")).toBeInTheDocument();
  });

  it("creates one selected row per container and enforces then resets RG4 bis", () => {
    renderComponent({
      status: "success",
      interventions: mockFluidesFrigorigenesInterventions
    });
    const importButton = screen.getByRole("button", {
      name: "Importer les fiches d'interventions"
    });
    const first = screen.getByRole("checkbox", {
      name: "Sélectionner la fiche FI-2026-001"
    });
    const second = screen.getByRole("checkbox", {
      name: "Sélectionner la fiche FI-2026-002"
    });
    expect(importButton).toBeDisabled();
    fireEvent.click(second);
    expect(importButton).toBeEnabled();
    expect(first).toBeDisabled();
    const selectedTable = screen.getByRole("table", {
      name: "Fiches d'intervention sélectionnées"
    });
    expect(within(selectedTable).getByText("BOUT-003")).toBeInTheDocument();
    fireEvent.click(second);
    expect(importButton).toBeDisabled();
    expect(first).toBeEnabled();
  });

  it("creates all container rows for a multi-container intervention", () => {
    renderComponent({
      status: "success",
      interventions: mockFluidesFrigorigenesInterventions
    });
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Sélectionner la fiche FI-2026-001"
      })
    );
    const table = screen.getByRole("table", {
      name: "Fiches d'intervention sélectionnées"
    });
    expect(within(table).getByText("BOUT-001")).toBeInTheDocument();
    expect(within(table).getByText("BOUT-002")).toBeInTheDocument();
  });
});
