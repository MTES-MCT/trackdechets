import type { ZodBsff } from "../schema";
import {
  buildBsffPickupSiteInput,
  isManualBsffPickupSite
} from "../utils/pickupSite";

const values = (overrides: Partial<ZodBsff> = {}) =>
  ({
    type: "TRACER_FLUIDE",
    pickupSiteEnabled: true,
    pickupSiteManualMode: false,
    emitter: {
      pickupSite: {
        name: " Site de collecte ",
        address: " 1 rue de Paris 75001 Paris ",
        street: " 2 rue manuelle ",
        address2: " Bâtiment B ",
        postalCode: " 69001 ",
        city: " Lyon ",
        infos: " Accès cour ",
        ...overrides.emitter?.pickupSite
      }
    },
    ...overrides
  } as ZodBsff);

describe("buildBsffPickupSiteInput", () => {
  it("n'enregistre rien lorsque le lieu différent est désactivé", () => {
    expect(
      buildBsffPickupSiteInput(values({ pickupSiteEnabled: false }))
    ).toBeNull();
  });

  it("enregistre uniquement l'adresse sélectionnée en mode autocomplétion", () => {
    expect(buildBsffPickupSiteInput(values())).toEqual({
      name: "Site de collecte",
      address: "1 rue de Paris 75001 Paris",
      street: null,
      address2: null,
      postalCode: null,
      city: null,
      infos: null
    });
  });

  it("enregistre uniquement les champs manuels en mode manuel", () => {
    expect(
      buildBsffPickupSiteInput(values({ pickupSiteManualMode: true }))
    ).toEqual({
      name: "Site de collecte",
      address: null,
      street: "2 rue manuelle",
      address2: "Bâtiment B",
      postalCode: "69001",
      city: "Lyon",
      infos: "Accès cour"
    });
  });

  it("restaure le mode manuel lors de la réouverture d'un brouillon", () => {
    expect(isManualBsffPickupSite({ address: "Adresse automatique" })).toBe(
      false
    );
    expect(isManualBsffPickupSite({ street: "2 rue manuelle" })).toBe(true);
  });
});
