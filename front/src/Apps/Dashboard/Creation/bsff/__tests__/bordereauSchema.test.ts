import { rawBsffSchema } from "../schema";

const holder = {
  siret: "00000000000000",
  contact: "Jean Dupont",
  phone: "0102030405",
  mail: "jean@example.com"
};

const parse = (values: Record<string, unknown>) =>
  rawBsffSchema.safeParse({
    type: "TRACER_FLUIDE",
    emitter: { company: holder },
    packagings: [],
    ...values
  });

describe("onglet Bordereau du parcours détenteur", () => {
  it("exige les coordonnées du détenteur", () => {
    const result = parse({ emitter: { company: {} } });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join("."))).toEqual(
        expect.arrayContaining([
          "emitter.company.siret",
          "emitter.company.contact",
          "emitter.company.phone",
          "emitter.company.mail"
        ])
      );
    }
  });

  it("limite le format téléphone au parcours détenteur", () => {
    expect(
      parse({ emitter: { company: { ...holder, phone: "01 02 03" } } }).success
    ).toBe(false);
    expect(
      parse({
        type: "COLLECTE_PETITES_QUANTITES",
        emitter: { company: { ...holder, phone: "01 02 03" } }
      }).success
    ).toBe(true);
  });

  it("exige le lieu de collecte uniquement lorsque le toggle est actif", () => {
    expect(parse({ pickupSiteEnabled: false }).success).toBe(true);
    const result = parse({ pickupSiteEnabled: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join("."))).toEqual(
        expect.arrayContaining([
          "emitter.pickupSite.name",
          "emitter.pickupSite.address",
          "emitter.pickupSite.postalCode"
        ])
      );
    }
  });
});
