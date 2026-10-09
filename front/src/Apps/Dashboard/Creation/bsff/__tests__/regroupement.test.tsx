import React, { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { BsffType } from "@td/codegen-ui";
import Bordereau from "../steps/Bordereau";
import Waste from "../steps/Waste";
import Detenteur from "../steps/Detenteur";
import initialState from "../utils/initial-state";
import { ZodBsff } from "../schema";
import { useReconditioningContainers } from "../components/useReconditioningContainers";
import { getGroupingPackagings } from "../utils/reconditionnement";
import { MockedProvider } from "@apollo/client/testing";
import BsffFormSteps from "../FormSteps";

jest.mock("../components/useReconditioningContainers", () => ({
  useReconditioningContainers: jest.fn()
}));
jest.mock("../components/MyBsffComapnySelector", () => ({
  __esModule: true,
  default: ({
    onChange
  }: {
    onChange: (company: { siret: string }) => void;
  }) => (
    <div>
      Installation TTR
      <button
        type="button"
        onClick={() => onChange({ siret: "22222222222222" })}
      >
        Choisir installation
      </button>
    </div>
  )
}));
jest.mock(
  "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper",
  () => ({
    __esModule: true,
    default: ({ disabled }: { disabled: boolean }) => (
      <input aria-label="Identification" disabled={disabled} />
    )
  })
);

const sources = ["B1", "B2", "B3"].map((numero, index) => ({
  id: `source-${numero}`,
  numero,
  type: "BOUTEILLE" as const,
  volume: index === 2 ? null : 20,
  weight: 5,
  bsffId: `BSFF-${numero}`,
  acceptation: {
    weight: 4,
    wasteCode: "14 06 01*",
    wasteDescription: "Fluide récupéré"
  },
  bsff: {
    emitter: { company: { name: "Émetteur initial" } },
    waste: { adr: null }
  },
  detenteurs: [
    {
      isPrivateIndividual: index === 2,
      company:
        index === 2
          ? { name: "Jean", address: "3 rue des Lilas" }
          : {
              siret: "11111111111111",
              name: "A",
              contact: "Alice",
              phone: "0102030405",
              mail: null
            }
    }
  ]
}));

it("uses the source BSFF lineage to restore historical volumes when container numbers are equal", () => {
  const selected = sources.slice(0, 2).map((p, index) => ({
    ...p,
    numero: "1",
    volume: null,
    bsff: { ...p.bsff, id: `original-${index}` }
  }));
  const saved = [0, 1].map(index => ({
    id: `saved-${index}`,
    numero: "1",
    volume: 10 + index,
    previousBsffs: [{ id: `original-${index}` }]
  }));
  expect(getGroupingPackagings(selected, saved).map(p => p.volume)).toEqual([
    10, 11
  ]);
});

it("does not copy the first saved volume if a container number is ambiguous", () => {
  const selected = [{ ...sources[0], volume: null }];
  expect(
    getGroupingPackagings(selected, [
      { numero: "B1", volume: 10 },
      { numero: "B1", volume: 20 }
    ])[0].volume
  ).toBeNull();
});

it("does not transfer a manually completed volume to a newly selected container with the same number", () => {
  const selected = [{ ...sources[0], id: "new-source", volume: null }];
  expect(
    getGroupingPackagings(selected, [
      { id: "removed-source", numero: "B1", volume: 20 }
    ])[0].volume
  ).toBeNull();
});

function Form() {
  const [tab, setTab] = useState("bordereau");
  const methods = useForm<ZodBsff>({
    defaultValues: {
      ...initialState,
      type: BsffType.Groupement,
      emitter: { company: { siret: "22222222222222" } },
      grouping: [],
      packagings: []
    }
  });
  return (
    <FormProvider {...methods}>
      <button onClick={() => setTab("waste")}>Onglet Déchet</button>
      <button onClick={() => setTab("detenteur")}>Onglet Détenteur</button>
      {tab === "bordereau" ? (
        <Bordereau />
      ) : tab === "waste" ? (
        <Waste />
      ) : (
        <Detenteur />
      )}
      <output aria-label="Sélection confirmée">
        {JSON.stringify(methods.watch("grouping"))}
      </output>
      <output aria-label="Détenteurs">
        {JSON.stringify(methods.watch("ficheInterventions"))}
      </output>
    </FormProvider>
  );
}

it("stays on Bordereau when switching to grouping and explains empty downstream tabs", async () => {
  jest
    .mocked(useReconditioningContainers)
    .mockReturnValue({
      containers: [],
      total: 0,
      loading: false,
      error: undefined
    });
  render(
    <MockedProvider>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <BsffFormSteps />
      </MemoryRouter>
    </MockedProvider>
  );
  fireEvent.click(screen.getByRole("radio", { name: "Le regroupement" }));
  expect(screen.getByRole("tab", { name: /Bordereau/ })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  expect(
    screen.getByText("Installation de tri, transit, regroupement ou traitement")
  ).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: /Déchet/ }));
  expect(
    await screen.findByText(/pour renseigner les informations du déchet/)
  ).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: /Détenteur/ }));
  expect(
    await screen.findByText(/pour reprendre leurs détenteurs/)
  ).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: /Bordereau/ }));
  jest
    .mocked(useReconditioningContainers)
    .mockReturnValue({
      containers: sources,
      total: 3,
      loading: false,
      error: undefined
    });
  fireEvent.click(screen.getByRole("button", { name: "Choisir installation" }));
  const available = within(
    screen.getByRole("table", { name: "Contenants disponibles" })
  );
  for (let index = 0; index < 3; index++)
    fireEvent.click(available.getAllByRole("button", { name: "Ajouter" })[0]);
  fireEvent.click(
    screen.getByRole("button", { name: "Ajouter les contenants" })
  );
  fireEvent.click(screen.getByRole("tab", { name: /Déchet/ }));
  expect(await screen.findByDisplayValue("Fluide récupéré")).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: /Détenteur/ }));
  expect(await screen.findByDisplayValue("Alice")).toBeVisible();
  expect(screen.getByDisplayValue("Jean")).toBeVisible();
});

it("follows B1/B2/B3 from Bordereau confirmation to their holders, with conditional historical locks", async () => {
  jest.mocked(useReconditioningContainers).mockReturnValue({
    containers: sources,
    total: 3,
    loading: false,
    error: undefined
  });
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Form />
    </MemoryRouter>
  );
  const available = within(
    screen.getByRole("table", { name: "Contenants disponibles" })
  );
  for (let index = 0; index < 3; index++)
    fireEvent.click(available.getAllByRole("button", { name: "Ajouter" })[0]);
  expect(screen.getByLabelText("Sélection confirmée")).toHaveTextContent("[]");
  fireEvent.click(
    screen.getByRole("button", { name: "Ajouter les contenants" })
  );
  expect(screen.getByLabelText("Sélection confirmée")).toHaveTextContent(
    "source-B1"
  );
  expect(useReconditioningContainers).toHaveBeenCalledWith(
    "22222222222222",
    undefined,
    BsffType.Groupement
  );
  fireEvent.click(screen.getByRole("button", { name: "Onglet Déchet" }));
  expect(
    await screen.findByRole("textbox", {
      name: "Dénomination usuelle du déchet"
    })
  ).toHaveValue("Fluide récupéré");
  expect(
    screen.getByRole("textbox", { name: "Dénomination usuelle du déchet" })
  ).toBeDisabled();
  expect(
    screen.getByRole("textbox", { name: /Mentions au titre/ })
  ).toBeEnabled();
  const volumes = screen.getAllByRole("spinbutton", {
    name: "Volume en litres"
  });
  expect(
    screen.getByRole("spinbutton", { name: "Poids total en kilos" })
  ).toHaveAttribute("readonly");
  expect(volumes[0]).toHaveAttribute("readonly");
  expect(volumes[2]).not.toHaveAttribute("readonly");
  fireEvent.click(screen.getByRole("button", { name: "Onglet Détenteur" }));
  expect(await screen.findByDisplayValue("Alice")).toHaveAttribute("readonly");
  const holders = JSON.parse(screen.getByLabelText("Détenteurs").textContent!);
  expect(holders).toHaveLength(2);
  expect(holders[0].packagings).toEqual([
    { id: "source-B1", numero: "B1" },
    { id: "source-B2", numero: "B2" }
  ]);
  expect(holders[1].packagings).toEqual([{ id: "source-B3", numero: "B3" }]);
});
