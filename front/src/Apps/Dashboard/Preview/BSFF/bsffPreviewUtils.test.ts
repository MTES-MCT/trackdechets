import { Bsff, BsffPackagingType, BsffType } from "@td/codegen-ui";
import {
  getBsffDetainerRows,
  getBsffPreviewActorTabs
} from "./bsffPreviewUtils";

const company = (siret: string, name: string) => ({
  siret,
  name,
  address: `${name} address`
});

const detenteur = (siret: string, name: string) => ({
  isPrivateIndividual: false,
  company: company(siret, name)
});

const packaging = (
  id: string,
  numero: string,
  detenteurs: ReturnType<typeof detenteur>[],
  ficheInterventions: Array<{ id: string; numero: string }> = []
) => ({
  id,
  numero,
  type: BsffPackagingType.Bouteille,
  weight: 15,
  detenteurs,
  ficheInterventions
});

const bsff = (values: Partial<Bsff>) =>
  ({
    type: BsffType.TracerFluide,
    emitter: { company: company("00000000000001", "Émetteur") },
    packagings: [],
    ficheInterventions: [],
    ...values
  } as Bsff);

describe("BSFF preview actor tabs", () => {
  it("shows only Détenteur when the waste and equipment holder are the same", () => {
    const bsd = bsff({
      packagings: [
        packaging("packaging-1", "BT-15-15", [
          detenteur("00000000000001", "Émetteur")
        ])
      ]
    });

    expect(getBsffPreviewActorTabs(bsd)).toEqual([
      { tabId: "emetteur", label: "Détenteur" }
    ]);
  });

  it("shows Détenteur and Producteur when equipment holders differ", () => {
    const bsd = bsff({
      packagings: [
        packaging("packaging-1", "BT-15-15", [
          detenteur("00000000000002", "Producteur")
        ])
      ]
    });

    expect(getBsffPreviewActorTabs(bsd)).toEqual([
      { tabId: "emetteur", label: "Détenteur" },
      { tabId: "detenteur", label: "Producteur" }
    ]);
  });

  it("keeps an equipment holder visible without an intervention sheet", () => {
    const holder = detenteur("00000000000002", "Producteur");
    const bsd = bsff({
      packagings: [packaging("packaging-1", "BT-15-15", [holder])]
    });

    const [row] = getBsffDetainerRows(bsd);
    expect(row).toEqual(
      expect.objectContaining({
        packaging: expect.objectContaining({ numero: "BT-15-15" }),
        detenteur: holder
      })
    );
    expect(row.ficheIntervention).toBeUndefined();
  });

  it("keeps the operator tab IDs and renames its holder tab Producteur", () => {
    const bsd = bsff({
      type: BsffType.CollectePetitesQuantites,
      packagings: [
        packaging("packaging-1", "BT-15-15", [
          detenteur("00000000000002", "Producteur")
        ])
      ]
    });

    expect(getBsffPreviewActorTabs(bsd)).toEqual([
      { tabId: "emetteur", label: "Opérateur" },
      { tabId: "detenteur", label: "Producteur" }
    ]);
  });

  it("associates an intervention sheet only with its packaging", () => {
    const firstHolder = detenteur("00000000000002", "Producteur 1");
    const secondHolder = detenteur("00000000000003", "Producteur 2");
    const fiche = {
      id: "fiche-1",
      numero: "FI15",
      isExempted: false,
      weight: 15,
      postalCode: "75000",
      detenteur: firstHolder,
      packagings: []
    };
    const bsd = bsff({
      packagings: [
        packaging("packaging-1", "BT-15-15", [firstHolder], [fiche]),
        packaging("packaging-2", "BT-16-16", [secondHolder])
      ],
      ficheInterventions: [fiche]
    });

    const rows = getBsffDetainerRows(bsd);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        packaging: expect.objectContaining({ numero: "BT-15-15" }),
        ficheIntervention: fiche
      })
    );
    expect(rows[1]).toEqual(
      expect.objectContaining({
        packaging: expect.objectContaining({ numero: "BT-16-16" })
      })
    );
    expect(rows[1].ficheIntervention).toBeUndefined();
  });
});
