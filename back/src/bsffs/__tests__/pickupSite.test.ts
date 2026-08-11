import type { BsffInput } from "@td/codegen-back";
import { flattenBsffInput } from "../converter";
import { bsffEditionRules } from "../validation/bsff/rules";

const flattenedPickupSiteFields = {
  emitterPickupSiteName: "Chantier Nord",
  emitterPickupSiteAddress: null,
  emitterPickupSiteStreet: "12 rue des Fleurs",
  emitterPickupSiteAddress2: "Bâtiment B",
  emitterPickupSitePostalCode: "75001",
  emitterPickupSiteCity: "Paris",
  emitterPickupSiteInfos: "Accès par la cour"
};

describe("BSFF pickup site", () => {
  it("flattens every GraphQL pickup site field to its Prisma field", () => {
    const input: BsffInput = {
      emitter: {
        pickupSite: {
          name: "Chantier Nord",
          address: null,
          street: "12 rue des Fleurs",
          address2: "Bâtiment B",
          postalCode: "75001",
          city: "Paris",
          infos: "Accès par la cour"
        }
      }
    };

    expect(flattenBsffInput(input)).toEqual(flattenedPickupSiteFields);
  });

  it("turns pickupSite null into an explicit null update for every field", () => {
    expect(flattenBsffInput({ emitter: { pickupSite: null } })).toEqual(
      Object.fromEntries(
        Object.keys(flattenedPickupSiteFields).map(field => [field, null])
      )
    );
  });

  it("declares an edition rule for every persisted pickup site field", () => {
    expect(
      Object.fromEntries(
        Object.entries(bsffEditionRules)
          .filter(([field]) => field.startsWith("emitterPickupSite"))
          .map(([field, rule]) => [field, rule.path?.join(".")])
      )
    ).toEqual({
      emitterPickupSiteName: "emitter.pickupSite.name",
      emitterPickupSiteAddress: "emitter.pickupSite.address",
      emitterPickupSiteStreet: "emitter.pickupSite.street",
      emitterPickupSiteAddress2: "emitter.pickupSite.address2",
      emitterPickupSitePostalCode: "emitter.pickupSite.postalCode",
      emitterPickupSiteCity: "emitter.pickupSite.city",
      emitterPickupSiteInfos: "emitter.pickupSite.infos"
    });
  });
});
