import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import type {
  Bsff,
  BsffDetenteur,
  BsffFicheIntervention,
  BsffPackaging
} from "@td/codegen-back";
import { BsffPackagingType, BsffType } from "@td/prisma";
import { BsffEquipmentHolders } from "../BsffPdf";
import {
  FICHE_INTERVENTION_EXEMPTION,
  formatEquipmentHolderContact,
  formatEquipmentHolderIdentification,
  formatFicheIntervention,
  getEquipmentHolderRows
} from "../equipmentHolders";

const organization = (siret: string, name: string): BsffDetenteur => ({
  isPrivateIndividual: false,
  company: {
    siret,
    name,
    address: `${name} address`,
    contact: "Amaury THIEBAUT",
    mail: "athiebaut@norsys.fr"
  }
});

const individual: BsffDetenteur = {
  isPrivateIndividual: true,
  company: {
    name: "Amaury THIEBAUT",
    address: "1 rue de Paris",
    contact: "Amaury THIEBAUT",
    mail: "athiebaut@norsys.fr"
  }
};

const packaging = (
  detenteurs: BsffDetenteur[],
  ficheInterventions: BsffFicheIntervention[] = []
) =>
  ({
    id: "packaging-1",
    numero: "BT-15-15",
    type: BsffPackagingType.BOUTEILLE,
    weight: 15,
    detenteurs,
    ficheInterventions
  } as BsffPackaging);

const fiche = (
  detenteur: BsffDetenteur,
  values: Partial<BsffFicheIntervention> = {}
) =>
  ({
    id: "fiche-1",
    numero: "FI15",
    isExempted: false,
    weight: 15,
    postalCode: "75000",
    detenteur,
    packagings: [],
    ...values
  } as BsffFicheIntervention);

const bsff = (
  type: BsffType,
  packagings: BsffPackaging[],
  ficheInterventions: BsffFicheIntervention[] = []
) =>
  ({
    id: "FF-TEST",
    type,
    emitter: {
      company: {
        siret: "00000000000001",
        name: "Établissement test",
        address: "1 rue du test",
        contact: "Contact émetteur",
        mail: "emetteur@example.com"
      }
    },
    packagings,
    ficheInterventions,
    previousBsffs: []
  } as Bsff & {
    packagings: BsffPackaging[];
    ficheInterventions: BsffFicheIntervention[];
    previousBsffs: Bsff[];
  });

describe("BSFF PDF equipment holders", () => {
  it("maps the packaging, quantity and intervention sheet number", () => {
    const holder = organization("00000077614733", "Etablissement test");
    const intervention = fiche(holder);
    const form = bsff(
      BsffType.COLLECTE_PETITES_QUANTITES,
      [packaging([holder], [intervention])],
      [intervention]
    );

    const [row] = getEquipmentHolderRows(form);
    expect(row.packaging?.numero).toBe("BT-15-15");
    expect(row.packaging?.weight).toBe(15);
    expect(formatFicheIntervention(row.ficheIntervention, form.type)).toBe(
      "FI15"
    );
  });

  it("prints the R.543-82 exemption only for the operator journey", () => {
    const holder = organization("00000077614733", "Etablissement test");
    const exemption = fiche(holder, { numero: "", isExempted: true });

    expect(
      formatFicheIntervention(exemption, BsffType.COLLECTE_PETITES_QUANTITES)
    ).toBe(FICHE_INTERVENTION_EXEMPTION);
    expect(formatFicheIntervention(exemption, BsffType.TRACER_FLUIDE)).toBe("");
  });

  it("leaves the intervention cell empty without a sheet or exemption", () => {
    expect(
      formatFicheIntervention(undefined, BsffType.COLLECTE_PETITES_QUANTITES)
    ).toBe("");
  });

  it("formats organization, individual and contact values without nulls", () => {
    const holder = organization("00000077614733", "Etablissement test");

    expect(formatEquipmentHolderIdentification(holder)).toBe(
      "00000077614733 - Etablissement test"
    );
    expect(formatEquipmentHolderIdentification(individual)).toBe(
      "Amaury THIEBAUT"
    );
    expect(formatEquipmentHolderContact(individual)).toBe(
      "Amaury THIEBAUT - athiebaut@norsys.fr"
    );
    expect(
      formatEquipmentHolderContact({
        ...individual,
        company: { ...individual.company, contact: null }
      })
    ).toBe("athiebaut@norsys.fr");
  });

  it("uses emitter data when the waste holder is the equipment holder", () => {
    const form = bsff(BsffType.TRACER_FLUIDE, [packaging([])]);

    const [row] = getEquipmentHolderRows(form);
    expect(formatEquipmentHolderIdentification(row.detenteur)).toBe(
      "00000000000001 - Établissement test"
    );
  });

  it("does not add the equipment-holder table to another BSFF journey", () => {
    const holder = organization("00000077614733", "Etablissement test");
    const form = bsff(BsffType.GROUPEMENT, [packaging([holder])]);

    expect(getEquipmentHolderRows(form)).toEqual([]);
  });

  it("renders the new title and five columns without the former subtitle", () => {
    const holder = organization("00000077614733", "Etablissement test");
    const form = bsff(BsffType.TRACER_FLUIDE, [packaging([holder])]);
    const html = ReactDOMServer.renderToStaticMarkup(
      <BsffEquipmentHolders bsff={form} />
    );

    expect(html).toContain("Détenteurs des équipements visés par le bordereau");
    expect(html).toContain("Contenant");
    expect(html).toContain("Quantité de fluide en kg");
    expect(html).toContain("Numéro fiche d&#x27;intervention");
    expect(html).toContain("Détenteur d&#x27;équipement");
    expect(html).toContain("Infos contact");
    expect(html).not.toContain("Fiches d&#x27;interventions liées");
  });
});
