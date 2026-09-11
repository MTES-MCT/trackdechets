import { adaptFluidesFrigorigenesIntervention } from "./adapter";
import { FluidesFrigorigenesDto } from "./api";

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
  detenteur: { siret: "53075596600047", nom: "Détenteur" },
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
      weightKg: 5.5,
      interventionDate: "2026-01-02",
      isAssociated: true,
      containers: [
        {
          id: "b-1",
          number: "BOUT-001",
          wasteCode: "14 06 01*",
          weightKg: 2.5,
          volumeLiters: undefined
        },
        {
          id: "b-2",
          number: "BOUT-002",
          wasteCode: "14 06 01*",
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
