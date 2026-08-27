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

  it("n'exige pas le lieu de collecte lorsque le toggle est inactif", () => {
    expect(parse({ pickupSiteEnabled: false }).success).toBe(true);
  });

  it("exige le nom et l'adresse en mode autocomplétion", () => {
    const result = parse({ pickupSiteEnabled: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(issue => issue.path.join("."));
      expect(paths).toEqual(
        expect.arrayContaining([
          "emitter.pickupSite.name",
          "emitter.pickupSite.address"
        ])
      );
      expect(paths).not.toContain("emitter.pickupSite.street");
      expect(paths).not.toContain("emitter.pickupSite.postalCode");
      expect(paths).not.toContain("emitter.pickupSite.city");
    }
  });

  it("exige les champs d'adresse manuelle lorsque ce mode est actif", () => {
    const result = parse({
      pickupSiteEnabled: true,
      pickupSiteManualMode: true
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map(issue => issue.path.join("."));
      expect(paths).toEqual(
        expect.arrayContaining([
          "emitter.pickupSite.name",
          "emitter.pickupSite.street",
          "emitter.pickupSite.postalCode",
          "emitter.pickupSite.city"
        ])
      );
      expect(paths).not.toContain("emitter.pickupSite.address");
    }
  });

  it("n'applique pas les règles détenteur aux autres parcours BSFF", () => {
    expect(
      parse({
        type: "COLLECTE_PETITES_QUANTITES",
        pickupSiteEnabled: true
      }).success
    ).toBe(true);
  });
});
