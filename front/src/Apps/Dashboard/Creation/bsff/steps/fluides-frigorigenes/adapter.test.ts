import {
  adaptFluidesFrigorigenesIntervention,
  adaptFluidesFrigorigenesToBsffImport,
  FluidesFrigorigenesImportError
} from "./adapter";
import { FluidesFrigorigenesDto } from "./api";
import { FluidesFrigorigenesIntervention } from "./model";
import { rawBsffSchema } from "../../schema";
import initialState from "../../utils/initial-state";

const dto: FluidesFrigorigenesDto = {
  ficheInterventionNumero: "FI-123",
  dateIntervention: "2026-01-02T10:00:00.000Z",
  dechets: [
    {
      bouteilleId: "b-1",
      bouteilleIdentification: "BOUT-001",
      codeDechet: "14 06 01*",
      poidsFluide: 2.5,
      volumeContenant: null,
      mentionADR: null
    },
    {
      bouteilleId: "b-2",
      bouteilleIdentification: "BOUT-002",
      codeDechet: "14 06 01*",
      poidsFluide: 3,
      volumeContenant: 12,
      mentionADR: null
    }
  ],
  detenteur: {
    siret: "53075596600047",
    nom: "Détenteur",
    adresse: "1 rue du Test, 75001 Paris",
    codePostal: "75001",
    ville: "Paris"
  },
  operateur: { siret: "35600000000048", nom: "Opérateur" },
  sourceData: "fluides_frigo",
  ffFicheId: "ff-id",
  quantiteTotalRecuperation: "999",
  associatedBsffIds: ["BSFF-1"]
};

describe("adaptFluidesFrigorigenesIntervention", () => {
  it("maps a CERFA and derives its weight from all bottle weights", () => {
    expect(adaptFluidesFrigorigenesIntervention(dto)).toEqual({
      id: "ff-id",
      number: "FI-123",
      wasteCodes: ["14 06 01*"],
      equipmentHolder: "Détenteur",
      holder: {
        siret: "53075596600047",
        name: "Détenteur",
        address: "1 rue du Test, 75001 Paris",
        postalCode: "75001",
        city: "Paris"
      },
      weightKg: 5.5,
      interventionDate: "2026-01-02",
      isAssociated: true,
      containers: [
        {
          id: "b-1",
          number: "BOUT-001",
          wasteCode: "14 06 01*",
          adr: undefined,
          weightKg: 2.5,
          volumeLiters: undefined
        },
        {
          id: "b-2",
          number: "BOUT-002",
          wasteCode: "14 06 01*",
          adr: undefined,
          weightKg: 3,
          volumeLiters: 12
        }
      ]
    });
  });

  it("handles null optional values", () => {
    const result = adaptFluidesFrigorigenesIntervention({
      ...dto,
      dateIntervention: null,
      quantiteTotalRecuperation: undefined,
      associatedBsffIds: []
    });

    expect(result.interventionDate).toBeUndefined();
    expect(result.isAssociated).toBe(false);
  });

  it("preserves every waste code of a mixed intervention", () => {
    const result = adaptFluidesFrigorigenesIntervention({
      ...dto,
      dechets: [{ ...dto.dechets[0], codeDechet: "16 05 04*" }, dto.dechets[1]]
    });

    expect(result.wasteCodes).toEqual(["14 06 01*", "16 05 04*"]);
    expect(result.containers.map(({ wasteCode }) => wasteCode)).toEqual([
      "16 05 04*",
      "14 06 01*"
    ]);
  });

  it("keeps an intervention without bottles without failing the dataset", () => {
    const result = adaptFluidesFrigorigenesIntervention({
      ...dto,
      dechets: []
    });

    expect(result.wasteCodes).toEqual([]);
    expect(result.containers).toEqual([]);
  });
});

const intervention = (
  overrides: Partial<FluidesFrigorigenesIntervention> &
    Pick<FluidesFrigorigenesIntervention, "id" | "number" | "containers">
): FluidesFrigorigenesIntervention => ({
  wasteCodes: ["14 06 02*"],
  equipmentHolder: "Entreprise A",
  holder: {
    siret: "53075596600047",
    name: "Entreprise A",
    address: "1 rue du Test, 75001 Paris",
    postalCode: "75001",
    city: "Paris"
  },
  weightKg: overrides.containers.reduce(
    (total, container) => total + container.weightKg,
    0
  ),
  isAssociated: false,
  ...overrides
});

const container = (
  id: string,
  number: string,
  weightKg: number,
  adr?: string
) => ({
  id,
  number,
  wasteCode: "14 06 02*",
  weightKg,
  adr
});

const nominalInterventions: FluidesFrigorigenesIntervention[] = [
  intervention({
    id: "fi-1",
    number: "FI1",
    containers: [container("1", "B1", 10)]
  }),
  intervention({
    id: "fi-2",
    number: "FI2",
    containers: [container("2", "B2", 5)]
  }),
  intervention({
    id: "fi-3",
    number: "FI3",
    equipmentHolder: "Particulier B",
    holder: {
      siret: "",
      name: "Particulier B",
      address: "2 rue du Test, 69001 Lyon",
      postalCode: "69001",
      city: "Lyon"
    },
    containers: [container("3", "B3", 10)]
  })
];

describe("adaptFluidesFrigorigenesToBsffImport", () => {
  it("builds the nominal BSFF import and keeps one intervention block per sheet", () => {
    const result = adaptFluidesFrigorigenesToBsffImport(nominalInterventions);

    expect(result.waste).toEqual({
      code: "14 06 02*",
      description: "autres solvants et mélanges de solvants halogénés",
      adr: ""
    });
    expect(result.packagings).toHaveLength(3);
    expect(result.packagings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "BOUTEILLE",
          numero: "B1",
          weight: 10
        }),
        expect.objectContaining({ type: "BOUTEILLE", numero: "B2", weight: 5 }),
        expect.objectContaining({ type: "BOUTEILLE", numero: "B3", weight: 10 })
      ])
    );
    expect(result.weight).toEqual({ value: 25, isEstimate: false });
    expect(result.fluidesFrigorigenesImport).toEqual({
      selectedInterventionIds: ["fi-1", "fi-2", "fi-3"],
      interventions: [
        { id: "fi-1", number: "FI1", packagingNumbers: ["B1"] },
        { id: "fi-2", number: "FI2", packagingNumbers: ["B2"] },
        { id: "fi-3", number: "FI3", packagingNumbers: ["B3"] }
      ]
    });
    expect(result.ficheInterventions).toHaveLength(3);
    expect(
      result.ficheInterventions.map(({ numero, packagings }) => ({
        numero,
        packagings
      }))
    ).toEqual([
      { numero: "FI1", packagings: [{ numero: "B1" }] },
      { numero: "FI2", packagings: [{ numero: "B2" }] },
      { numero: "FI3", packagings: [{ numero: "B3" }] }
    ]);
  });

  it("imports one intervention", () => {
    const result = adaptFluidesFrigorigenesToBsffImport([
      nominalInterventions[0]
    ]);

    expect(result.packagings).toHaveLength(1);
    expect(result.ficheInterventions).toHaveLength(1);
    expect(result.weight.value).toBe(10);
  });

  it("keeps separate sheets belonging to the same holder", () => {
    const result = adaptFluidesFrigorigenesToBsffImport(
      nominalInterventions.slice(0, 2)
    );

    expect(result.ficheInterventions).toHaveLength(2);
    expect(
      result.ficheInterventions.map(fiche => fiche.detenteur?.company?.siret)
    ).toEqual(["53075596600047", "53075596600047"]);
    expect(result.ficheInterventions.map(fiche => fiche.packagings)).toEqual([
      [{ numero: "B1" }],
      [{ numero: "B2" }]
    ]);
  });

  it("builds an enterprise holder from its SIRET", () => {
    const holder = adaptFluidesFrigorigenesToBsffImport([
      nominalInterventions[0]
    ]).ficheInterventions[0];

    expect(holder.holderType).toBe("ENTREPRISE");
    expect(holder.detenteur).toEqual(
      expect.objectContaining({
        isPrivateIndividual: false,
        company: expect.objectContaining({
          siret: "53075596600047",
          name: "Entreprise A"
        })
      })
    );
  });

  it("builds a private holder without inventing a SIRET", () => {
    const holder = adaptFluidesFrigorigenesToBsffImport([
      nominalInterventions[2]
    ]).ficheInterventions[0];

    expect(holder.holderType).toBe("PARTICULIER");
    expect(holder.detenteur).toEqual(
      expect.objectContaining({
        isPrivateIndividual: true,
        company: expect.objectContaining({
          siret: null,
          name: "Particulier B",
          contact: "Particulier B"
        })
      })
    );
  });

  it("concatenates ADR mentions in source order without deduplicating them", () => {
    const interventions = [
      intervention({
        id: "fi-adr-1",
        number: "FI-ADR-1",
        containers: [
          container("1", "B1", 1, "ADR UN 1234"),
          container("2", "B2", 1, "ADR UN 1234")
        ]
      }),
      intervention({
        id: "fi-adr-2",
        number: "FI-ADR-2",
        containers: [container("3", "B3", 1, "ADR UN 5678")]
      })
    ];

    expect(adaptFluidesFrigorigenesToBsffImport(interventions).waste.adr).toBe(
      "ADR UN 1234, ADR UN 1234, ADR UN 5678"
    );
  });

  it("leaves bottle volumes empty and subject to the existing schema", () => {
    const result = adaptFluidesFrigorigenesToBsffImport([
      nominalInterventions[0]
    ]);

    expect(result.packagings[0].volume).toBe("");
    const parsed = rawBsffSchema.safeParse({ ...initialState, ...result });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["packagings", 0, "volume"] })
        ])
      );
    }
  });

  it("returns only import-owned fields", () => {
    const result = adaptFluidesFrigorigenesToBsffImport([
      nominalInterventions[0]
    ]);

    expect(Object.keys(result).sort()).toEqual([
      "ficheInterventions",
      "fluidesFrigorigenesImport",
      "packagings",
      "waste",
      "weight"
    ]);
    expect(result).not.toHaveProperty("destination");
    expect(result).not.toHaveProperty("emitter");
    expect(result).not.toHaveProperty("transporters");
  });

  it("does not mutate Fluides Frigorigènes interventions", () => {
    const input = nominalInterventions.map(item => ({
      ...item,
      holder: { ...item.holder },
      containers: item.containers.map(value => ({ ...value }))
    }));
    const before = structuredClone(input);

    adaptFluidesFrigorigenesToBsffImport(input);

    expect(input).toEqual(before);
  });

  it("rejects an import containing several waste codes", () => {
    const mixed = intervention({
      id: "fi-mixed",
      number: "FI-MIXED",
      wasteCodes: ["14 06 02*", "16 05 04*"],
      containers: [
        container("1", "B1", 1),
        { ...container("2", "B2", 1), wasteCode: "16 05 04*" }
      ]
    });

    expect(() => adaptFluidesFrigorigenesToBsffImport([mixed])).toThrow(
      FluidesFrigorigenesImportError
    );
  });
});
