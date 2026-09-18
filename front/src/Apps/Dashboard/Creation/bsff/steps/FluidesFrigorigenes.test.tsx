import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import FluidesFrigorigenesBsff, {
  FluidesFrigorigenesView
} from "./FluidesFrigorigenes";
import { FluidesFrigorigenesDataState } from "./fluides-frigorigenes/model";
import { fluidesFrigorigenesInterventionsFixture } from "./fluides-frigorigenes/fixtures";
import { useFluidesFrigorigenes } from "./fluides-frigorigenes/useFluidesFrigorigenes";
import initialState from "../utils/initial-state";
import RhfBsffPackagingList from "../components/RhfBsffPackagingList";
import { bsffPackagingTypes } from "../../../../Forms/Components/PackagingList/helpers";
import { BsffType } from "@td/codegen-ui";

jest.mock("./fluides-frigorigenes/useFluidesFrigorigenes", () => ({
  useFluidesFrigorigenes: jest.fn()
}));

const mockedUseFluidesFrigorigenes = jest.mocked(useFluidesFrigorigenes);

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
  beforeEach(() => mockedUseFluidesFrigorigenes.mockReset());

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

  it("imports the selected intervention when clicking the import button", () => {
    const onImport = jest.fn();
    render(
      <FluidesFrigorigenesView
        operatorSiret="12345678901234"
        state={{
          status: "success",
          interventions: fluidesFrigorigenesInterventionsFixture
        }}
        onImport={onImport}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter la fiche FI-2026-002" })
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Importer les fiches d'interventions"
      })
    );

    expect(onImport).toHaveBeenCalledWith([
      fluidesFrigorigenesInterventionsFixture[1]
    ]);
  });

  it("updates only the fields owned by the import", () => {
    mockedUseFluidesFrigorigenes.mockReturnValue({
      status: "success",
      interventions: fluidesFrigorigenesInterventionsFixture
    });

    function FormWrapper() {
      const methods = useForm({
        defaultValues: {
          ...initialState,
          emitter: {
            ...initialState.emitter,
            company: {
              ...initialState.emitter.company,
              siret: "12345678901234"
            }
          },
          destination: {
            ...initialState.destination,
            customInfo: "À préserver"
          }
        }
      });
      const values = methods.watch();

      return (
        <FormProvider {...methods}>
          <FluidesFrigorigenesBsff />
          <output data-testid="form-values">{JSON.stringify(values)}</output>
        </FormProvider>
      );
    }

    render(<FormWrapper />);
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter la fiche FI-2026-002" })
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Importer les fiches d'interventions"
      })
    );

    const values = JSON.parse(
      screen.getByTestId("form-values").textContent ?? "{}"
    );
    expect(values.destination.customInfo).toBe("À préserver");
    expect(values.emitter.company.siret).toBe("12345678901234");
    expect(values.waste.code).toBe("14 06 02*");
    expect(values.packagings).toEqual([
      expect.objectContaining({
        type: "BOUTEILLE",
        numero: "BOUT-003",
        weight: 5,
        volume: ""
      })
    ]);
    expect(values.weight).toEqual({ value: 5, isEstimate: false });
    expect(values.ficheInterventions[0].packagings).toEqual([
      { numero: "BOUT-003" }
    ]);
    expect(values.fluidesFrigorigenesImport).toEqual({
      selectedInterventionIds: ["fi-2"],
      interventions: [
        {
          id: "fi-2",
          number: "FI-2026-002",
          packagingNumbers: ["BOUT-003"]
        }
      ]
    });
  });

  it("restores selections after leaving and reopening the tab", () => {
    mockedUseFluidesFrigorigenes.mockReturnValue({
      status: "success",
      interventions: fluidesFrigorigenesInterventionsFixture
    });

    function FormWrapper() {
      const methods = useForm({
        defaultValues: {
          ...initialState,
          emitter: {
            ...initialState.emitter,
            company: {
              ...initialState.emitter.company,
              siret: "12345678901234"
            }
          }
        }
      });
      const [showFluidesFrigorigenes, setShowFluidesFrigorigenes] =
        React.useState(true);

      return (
        <FormProvider {...methods}>
          <button
            type="button"
            onClick={() => setShowFluidesFrigorigenes(visible => !visible)}
          >
            Changer d'onglet
          </button>
          {showFluidesFrigorigenes && <FluidesFrigorigenesBsff />}
        </FormProvider>
      );
    }

    render(<FormWrapper />);
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter la fiche FI-2026-002" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Changer d'onglet" }));
    fireEvent.click(screen.getByRole("button", { name: "Changer d'onglet" }));

    const selectedTable = screen.getByRole("table", {
      name: "Fiches d'intervention sélectionnées"
    });
    expect(within(selectedTable).getByText("FI-2026-002")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Importer les fiches d'interventions"
      })
    ).toBeEnabled();
  });

  it("labels imported containers with their intervention number and source", () => {
    function PackagingWrapper() {
      const methods = useForm({
        defaultValues: {
          type: BsffType.CollectePetitesQuantites,
          packagings: [
            {
              type: "BOUTEILLE",
              numero: "BOUT-003",
              weight: 5,
              volume: "",
              other: ""
            },
            {
              type: "BOUTEILLE",
              numero: "MANUEL-001",
              weight: 1,
              volume: 1,
              other: ""
            }
          ],
          fluidesFrigorigenesImport: {
            selectedInterventionIds: ["fi-2"],
            interventions: [
              {
                id: "fi-2",
                number: "FI-2026-002",
                packagingNumbers: ["BOUT-003"]
              }
            ]
          }
        }
      });

      return (
        <FormProvider {...methods}>
          <RhfBsffPackagingList
            fieldName="packagings"
            packagingTypes={bsffPackagingTypes}
            operateurMode
          />
        </FormProvider>
      );
    }

    render(<PackagingWrapper />);

    expect(
      screen.getByText("1 - FI-2026-002 - Importé depuis Fluides Frigorigènes")
    ).toBeInTheDocument();
    expect(screen.getByText("2 - Contenant")).toBeInTheDocument();
  });
});
