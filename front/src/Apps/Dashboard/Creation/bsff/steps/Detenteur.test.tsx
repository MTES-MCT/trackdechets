import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { BsffType } from "@td/codegen-ui";
import DetenteurBsff from "./Detenteur";
import initialState from "../utils/initial-state";
import { ZodBsff, rawBsffSchema } from "../schema";

jest.mock(
  "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper",
  () => ({
    __esModule: true,
    default: ({
      disabled,
      onCompanySelected
    }: {
      disabled: boolean;
      onCompanySelected: (company: { orgId: string; siret: string }) => void;
    }) => (
      <input
        aria-label="Identification"
        disabled={disabled}
        onChange={event =>
          onCompanySelected({
            orgId: event.target.value,
            siret: event.target.value
          })
        }
      />
    )
  })
);

function Form({
  type,
  editing = false,
  sourceSiret = "11111111111111"
}: {
  type: BsffType.Groupement | BsffType.Reconditionnement;
  editing?: boolean;
  sourceSiret?: string | null;
}) {
  const name = type === BsffType.Groupement ? "grouping" : "repackaging";
  const methods = useForm<ZodBsff>({
    defaultValues: {
      ...initialState,
      type,
      id: editing ? "edited" : undefined,
      ficheInterventions: editing
        ? [
            {
              id: "persisted-fiche",
              isExempted: false,
              detenteur: {
                isPrivateIndividual: false,
                company: {
                  siret: sourceSiret === null ? "33333333333333" : sourceSiret,
                  name: "A",
                  mail: "saved@example.org"
                }
              },
              packagings: [{ numero: "B1" }]
            }
          ]
        : [],
      [name]: [
        {
          id: "source-B1",
          numero: "B1",
          type: "BOUTEILLE",
          bsff: {},
          detenteurs: [
            {
              isPrivateIndividual: false,
              company: {
                siret: sourceSiret,
                name: "A",
                contact: "Alice",
                phone: "0102030405",
                mail: null
              }
            }
          ]
        }
      ]
    }
  });
  return (
    <FormProvider {...methods}>
      <DetenteurBsff />
      <button onClick={() => methods.setValue(name, [])}>
        Retirer les sources
      </button>
      <output aria-label="Données">
        {JSON.stringify(methods.watch("ficheInterventions"))}
      </output>
    </FormProvider>
  );
}

it.each([BsffType.Groupement, BsffType.Reconditionnement] as const)(
  "allows a historically absent identifier to be changed again after reopening %s",
  async type => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Form type={type} editing sourceSiret={null} />
      </MemoryRouter>
    );
    const identification = await screen.findByRole("textbox", {
      name: "Identification"
    });
    expect(identification).toBeEnabled();
    expect(screen.getByLabelText("Données")).toHaveTextContent(
      "33333333333333"
    );
    fireEvent.change(identification, { target: { value: "44444444444444" } });
    expect(screen.getByLabelText("Données")).toHaveTextContent(
      "44444444444444"
    );
    expect(screen.getByLabelText("Données")).not.toHaveTextContent(
      "33333333333333"
    );
  }
);

it.each([BsffType.Groupement, BsffType.Reconditionnement] as const)(
  "imports and locks only source fields in %s",
  async type => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Form type={type} />
      </MemoryRouter>
    );
    const contact = await screen.findByRole("textbox", {
      name: "Personne à contacter"
    });
    expect(contact).toHaveValue("Alice");
    expect(contact).toHaveAttribute("readonly");
    expect(
      screen.getByRole("textbox", { name: "Identification" })
    ).toBeDisabled();
    const mail = screen.getByRole("textbox", { name: "Courriel" });
    expect(mail).not.toHaveAttribute("readonly");
    expect(mail).toBeEnabled();
    fireEvent.change(mail, { target: { value: "completed@example.org" } });
    expect(mail).not.toHaveAttribute("readonly");
    expect(screen.getByLabelText("Données")).toHaveTextContent(
      "completed@example.org"
    );
    expect(screen.getByText("B1")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retirer les sources" })
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Données")).toHaveTextContent("[]")
    );
  }
);

it.each([BsffType.Groupement, BsffType.Reconditionnement] as const)(
  "preserves saved historical completions when reopening %s",
  async type => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Form type={type} editing />
      </MemoryRouter>
    );
    const mail = await screen.findByRole("textbox", { name: "Courriel" });
    expect(mail).toHaveValue("saved@example.org");
    expect(mail).not.toHaveAttribute("readonly");
  }
);

it("keeps source data and provenance through the Zod resolver", () => {
  const parsed = rawBsffSchema.safeParse({
    ...initialState,
    type: BsffType.Groupement,
    packagings: [],
    grouping: [
      {
        id: "source",
        bsff: {},
        detenteurs: [{ isPrivateIndividual: false, company: { name: "A" } }]
      }
    ],
    ficheInterventions: [
      {
        isExempted: false,
        sourceKey: "A",
        lockedFields: ["name"],
        detenteur: { isPrivateIndividual: false, company: { name: "A" } },
        packagings: [{ numero: "B1" }]
      }
    ]
  });
  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));
  if (parsed.success) {
    expect(parsed.data.grouping?.[0].detenteurs?.[0].company?.name).toBe("A");
    expect(parsed.data.ficheInterventions?.[0].lockedFields).toEqual(["name"]);
  }
});
