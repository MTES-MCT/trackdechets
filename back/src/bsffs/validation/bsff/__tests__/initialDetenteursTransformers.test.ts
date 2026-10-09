import { checkAndSetPreviousPackagings } from "../transformers";
import { checkPreviousPackagings } from "../refinements";
import { ParsedZodBsff } from "../schema";
import { getReadonlyBsffRepository } from "../../../repository";

jest.mock("../refinements", () => ({ checkPreviousPackagings: jest.fn() }));
jest.mock("../../../repository", () => ({
  getReadonlyBsffRepository: jest.fn(() => ({
    findUniqueGetFicheInterventions: jest.fn()
  }))
}));
jest.mock("../sirenify", () => ({ sirenifyBsff: jest.fn() }));
jest.mock("../recipify", () => ({ recipifyBsff: jest.fn() }));
jest.mock("../rules", () => ({ getSealedFields: jest.fn() }));
jest.mock("../../../../common/validation/zod/transformers", () => ({
  recipifyTransporter: jest.fn()
}));

const source = (
  id: string,
  numero: string,
  siret: string | null,
  name: string
) => ({
  id,
  numero,
  type: "BOUTEILLE",
  volume: 20,
  weight: 5,
  acceptationWeight: 4,
  other: null,
  ficheInterventions: [],
  detenteurs: [
    {
      detenteurIsPrivateIndividual: siret === null,
      detenteurCompanyName: name,
      detenteurCompanySiret: siret,
      detenteurCompanyAddress: "1 rue de Paris",
      detenteurCompanyContact: "Alice",
      detenteurCompanyPhone: null,
      detenteurCompanyMail: null as string | null
    }
  ]
});

it("rejects ambiguous grouping input instead of matching two null packaging identifiers", async () => {
  const sources = [
    source("id1", "1", "11111111111111", "A"),
    source("id2", "1", "22222222222222", "B")
  ].map(p => ({ ...p, nextPackagingId: null }));
  jest
    .mocked(checkPreviousPackagings)
    .mockResolvedValue(
      sources as unknown as Awaited<ReturnType<typeof checkPreviousPackagings>>
    );
  const addIssue = jest.fn();
  await checkAndSetPreviousPackagings(
    {
      type: "GROUPEMENT",
      packagings: [{ id: null, numero: "1", volume: 30 }]
    } as unknown as ParsedZodBsff,
    { addIssue, path: [] }
  );
  expect(addIssue).toHaveBeenCalledWith(
    expect.objectContaining({ path: ["packagings"] })
  );
});

it.each(["GROUPEMENT", "RECONDITIONNEMENT"] as const)(
  "protects waste source values and accepts absent historical waste fields in %s",
  async type => {
    const original = {
      ...source("id1", "B1", "11111111111111", "A"),
      acceptationWasteCode: "14 06 01*",
      bsff: { wasteDescription: "Initial", wasteAdr: null }
    };
    jest
      .mocked(checkPreviousPackagings)
      .mockResolvedValue([original] as unknown as Awaited<
        ReturnType<typeof checkPreviousPackagings>
      >);
    const input = {
      type,
      grouping: type === "GROUPEMENT" ? ["id1"] : [],
      repackaging: type === "RECONDITIONNEMENT" ? ["id1"] : [],
      wasteCode: "14 06 01*",
      wasteDescription: "Initial",
      wasteAdr: "Completed ADR",
      packagings: [{ id: "id1", numero: "B1" }]
    } as unknown as ParsedZodBsff;
    const addIssue = jest.fn();
    const result = await checkAndSetPreviousPackagings(input, {
      addIssue,
      path: []
    });
    expect(addIssue).not.toHaveBeenCalled();
    expect(result.wasteAdr).toBe("Completed ADR");
    const protectedResult = await checkAndSetPreviousPackagings(
      { ...input, wasteDescription: "Modified" },
      { addIssue, path: [] }
    );
    expect(protectedResult.wasteDescription).toBe("Initial");
    expect(addIssue).not.toHaveBeenCalled();
  }
);

it.each(["GROUPEMENT", "RECONDITIONNEMENT"] as const)(
  "protects a holder value known only on another source in %s",
  async type => {
    const sources = [
      source("id1", "B1", "11111111111111", "A"),
      source("id2", "B2", "11111111111111", "A")
    ];
    sources[1].detenteurs[0].detenteurCompanyMail = "initial@example.org";
    jest
      .mocked(checkPreviousPackagings)
      .mockResolvedValue(
        sources as unknown as Awaited<
          ReturnType<typeof checkPreviousPackagings>
        >
      );
    const input = {
      type,
      packagings: sources.map(p => ({
        id: p.id,
        numero: p.numero,
        detenteurs: [
          {
            isPrivateIndividual: false,
            company: { siret: "11111111111111", mail: "modified@example.org" }
          }
        ]
      }))
    } as unknown as ParsedZodBsff;
    const result = await checkAndSetPreviousPackagings(input, {
      addIssue: jest.fn(),
      path: []
    });
    expect(result.packagings![0].detenteurs![0].company?.mail).toBe(
      "initial@example.org"
    );
  }
);

it.each(["GROUPEMENT", "RECONDITIONNEMENT"] as const)(
  "does not infer unrelated whole-BSFF sheets for %s",
  async type => {
    const original = source("id1", "B1", "11111111111111", "A");
    const findFiches = jest
      .fn()
      .mockResolvedValue([{ id: "unrelated", ...original.detenteurs[0] }]);
    jest.mocked(getReadonlyBsffRepository).mockReturnValue({
      findUniqueGetFicheInterventions: findFiches
    } as unknown as ReturnType<typeof getReadonlyBsffRepository>);
    jest
      .mocked(checkPreviousPackagings)
      .mockResolvedValue([
        { ...original, detenteurs: [], ficheInterventions: [] }
      ] as unknown as Awaited<ReturnType<typeof checkPreviousPackagings>>);
    const result = await checkAndSetPreviousPackagings(
      {
        type,
        packagings: [{ id: "id1", numero: "B1" }]
      } as unknown as ParsedZodBsff,
      { addIssue: jest.fn(), path: [] }
    );
    expect(findFiches).not.toHaveBeenCalled();
    expect(result.packagings![0].ficheInterventions).toEqual([]);
    expect(result.packagings![0].detenteurs).toEqual([]);
  }
);

it("keeps holders separate when grouped source containers have the same number", async () => {
  const sources = [
    source("id1", "1", "11111111111111", "A"),
    source("id2", "1", "22222222222222", "B")
  ];
  jest
    .mocked(checkPreviousPackagings)
    .mockResolvedValue(
      sources as unknown as Awaited<ReturnType<typeof checkPreviousPackagings>>
    );
  const input = {
    type: "GROUPEMENT",
    grouping: ["id1", "id2"],
    packagings: sources.map((p, index) => ({
      id: p.id,
      numero: p.numero,
      detenteurs: [
        {
          isPrivateIndividual: false,
          company: {
            siret: p.detenteurs[0].detenteurCompanySiret,
            name: p.detenteurs[0].detenteurCompanyName,
            address: "1 rue de Paris",
            mail: `holder${index}@example.org`
          }
        }
      ]
    }))
  } as unknown as ParsedZodBsff;
  const result = await checkAndSetPreviousPackagings(input, {
    addIssue: jest.fn(),
    path: []
  });
  expect(result.packagings!.map(p => p.detenteurs![0].company?.mail)).toEqual([
    "holder0@example.org",
    "holder1@example.org"
  ]);
});

it.each(["GROUPEMENT", "RECONDITIONNEMENT"] as const)(
  "preserves associations and historical completions in %s",
  async type => {
    const sources = [
      source("id1", "B1", "11111111111111", "A"),
      source("id2", "B2", "11111111111111", "A"),
      source("id3", "B3", null, "Jean")
    ];
    jest
      .mocked(checkPreviousPackagings)
      .mockResolvedValue(
        sources as unknown as Awaited<
          ReturnType<typeof checkPreviousPackagings>
        >
      );
    const completion = {
      isPrivateIndividual: false,
      company: {
        siret: "11111111111111",
        name: "A",
        address: "1 rue de Paris",
        contact: "Modified",
        mail: "completed@example.org"
      }
    };
    const input = {
      type,
      weightValue: 999,
      grouping: type === "GROUPEMENT" ? ["id1", "id2", "id3"] : [],
      repackaging: type === "RECONDITIONNEMENT" ? ["id1", "id2", "id3"] : [],
      packagings:
        type === "GROUPEMENT"
          ? sources.map(p => ({ numero: p.numero, detenteurs: [completion] }))
          : [{ numero: "NEW", detenteurs: [completion] }]
    } as unknown as ParsedZodBsff;
    const result = await checkAndSetPreviousPackagings(input, {
      addIssue: jest.fn(),
      path: []
    });
    if (type === "GROUPEMENT") {
      expect(result.weightValue).toBe(12);
      expect(result.packagings).toHaveLength(3);
      expect(result.packagings!.map(p => p.previousPackagings)).toEqual([
        ["id1"],
        ["id2"],
        ["id3"]
      ]);
      expect(result.packagings![2].detenteurs![0].company?.name).toBe("Jean");
      expect(result.packagings![2].detenteurs![0].company?.mail).toBeNull();
    } else {
      expect(result.weightValue).toBe(999);
      expect(result.packagings).toHaveLength(1);
      expect(result.packagings![0].previousPackagings).toEqual([
        "id1",
        "id2",
        "id3"
      ]);
      expect(result.packagings![0].detenteurs).toHaveLength(2);
    }
    expect(result.packagings![0].detenteurs![0].company?.contact).toBe("Alice");
    expect(result.packagings![0].detenteurs![0].company?.mail).toBe(
      "completed@example.org"
    );
    expect(sources[0].detenteurs[0].detenteurCompanyMail).toBeNull();
  }
);
