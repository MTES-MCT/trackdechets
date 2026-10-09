import { BsffType } from "@td/codegen-ui";
import {
  buildInitialDetenteurs,
  getInitialDetenteurs,
  hasInitialValue,
  InitialContainer,
  usesInitialDetenteurs
} from "./initial-detenteurs";

const company = {
  siret: "11111111111111",
  name: "A",
  contact: "Alice",
  phone: "0102030405",
  mail: null
};
const container = (numero: string): InitialContainer => ({
  id: `id-${numero}`,
  numero,
  detenteurs: [{ isPrivateIndividual: false, company }]
});

it("does not take the first saved completion among ambiguous historical namesakes", () => {
  const initial = [
    {
      id: "source",
      numero: "B1",
      detenteurs: [
        { isPrivateIndividual: true, company: { name: "Jean", address: null } }
      ]
    }
  ];
  const saved = ["Paris", "Lyon"].map(address => ({
    detenteur: { isPrivateIndividual: true, company: { name: "Jean", address } }
  }));
  expect(
    buildInitialDetenteurs(initial, saved)[0].detenteur?.company?.address
  ).toBeUndefined();
});

it("collects and locks a source value present only in the linked intervention sheet", () => {
  const selected = container("B1");
  selected.ficheInterventions = [
    {
      detenteur: {
        isPrivateIndividual: false,
        company: { ...company, mail: "source@example.org" }
      }
    }
  ];
  const result = buildInitialDetenteurs([selected]);
  expect(result[0].detenteur?.company?.mail).toBe("source@example.org");
  expect(result[0].lockedFields).toContain("mail");
});

it.each([BsffType.Groupement, BsffType.Reconditionnement])(
  "enables the shared mapping for %s",
  type => {
    expect(usesInitialDetenteurs(type)).toBe(true);
    const holders = buildInitialDetenteurs([
      container("B1"),
      container("B2"),
      {
        id: "id-B3",
        numero: "B3",
        detenteurs: [
          {
            isPrivateIndividual: true,
            company: { name: "Jean", address: "3 rue des Lilas" }
          }
        ]
      }
    ]);
    expect(holders).toHaveLength(2);
    expect(holders[0].packagings).toEqual([
      { id: "id-B1", numero: "B1" },
      { id: "id-B2", numero: "B2" }
    ]);
    expect(holders[1].packagings).toEqual([{ id: "id-B3", numero: "B3" }]);
    expect(holders[1].detenteur?.company?.siret).toBeUndefined();
    expect(holders[0].lockedFields).toContain("isPrivateIndividual");
    expect(holders[0].lockedFields).toContain("contact");
    expect(holders[0].lockedFields).not.toContain("mail");
    expect(holders[0].id).toBeUndefined();
  }
);

it("preserves manual completions when source data is refreshed", () => {
  const holders = buildInitialDetenteurs([container("B1")]);
  holders[0].detenteur!.company!.mail = "completed@example.org";
  const refreshed = buildInitialDetenteurs(
    [container("B1"), container("B2")],
    holders
  );
  expect(refreshed[0].detenteur?.company?.mail).toBe("completed@example.org");
  expect(refreshed[0].lockedFields).not.toContain("mail");
});

it("preserves two distinct source IDs even when their displayed numbers are equal", () => {
  const holders = buildInitialDetenteurs([
    { ...container("1"), id: "source1" },
    { ...container("1"), id: "source2" }
  ]);
  expect(holders[0].packagings).toEqual([
    { id: "source1", numero: "1" },
    { id: "source2", numero: "1" }
  ]);
});

it("removes obsolete associations after a selection change", () => {
  const holders = buildInitialDetenteurs([container("B1"), container("B2")]);
  expect(
    buildInitialDetenteurs([container("B2")], holders)[0].packagings
  ).toEqual([{ id: "id-B2", numero: "B2" }]);
  expect(buildInitialDetenteurs([], holders)).toEqual([]);
});

it("does not attach other containers' holders through the whole-BSFF fallback", () => {
  const selected = container("B1");
  selected.bsff = {
    ficheInterventions: [
      { detenteur: { company: { siret: "22222222222222", name: "B" } } }
    ]
  };
  expect(getInitialDetenteurs(selected)).toHaveLength(1);
});

it("uses linked sheets and deduplicates the same holder across direct and sheet data", () => {
  const selected = container("B1");
  selected.ficheInterventions = [{ detenteur: selected.detenteurs![0] }];
  expect(getInitialDetenteurs(selected)).toHaveLength(1);
  selected.detenteurs = [];
  expect(getInitialDetenteurs(selected)[0].company?.siret).toBe(company.siret);
});

it("does not invent a historical association from whole-BSFF sheets", () => {
  expect(
    getInitialDetenteurs({
      bsff: { ficheInterventions: [{ detenteur: { company } }] }
    })
  ).toHaveLength(0);
});

it("distinguishes namesakes using the existing backend name/address identity rule", () => {
  const holders = buildInitialDetenteurs(
    ["3 rue des Lilas", "8 avenue des Roses"].map((address, index) => ({
      numero: `B${index}`,
      detenteurs: [
        { isPrivateIndividual: true, company: { name: "Jean", address } }
      ]
    }))
  );
  expect(holders).toHaveLength(2);
});

it("preserves a saved completion when a historical private individual's address was initially missing", () => {
  const selected = [
    {
      numero: "B1",
      detenteurs: [
        { isPrivateIndividual: true, company: { name: "Jean", address: null } }
      ]
    }
  ];
  const saved = buildInitialDetenteurs([
    {
      numero: "B1",
      detenteurs: [
        {
          isPrivateIndividual: true,
          company: { name: "Jean", address: "3 rue des Lilas" }
        }
      ]
    }
  ]);
  const reopened = buildInitialDetenteurs(selected, saved);
  expect(reopened[0].detenteur?.company?.address).toBe("3 rue des Lilas");
  expect(reopened[0].lockedFields).not.toContain("address");
});

it.each([0, false, "Alice"])(
  "recognizes %s as a present source value",
  value => {
    expect(hasInitialValue(value)).toBe(true);
  }
);
it.each([undefined, null, "", "  "])("recognizes %s as absent", value => {
  expect(hasInitialValue(value)).toBe(false);
});
