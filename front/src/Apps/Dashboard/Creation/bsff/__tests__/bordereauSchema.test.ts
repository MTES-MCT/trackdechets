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
    waste: {
      code: "13 03 10*",
      description: "Autres huiles isolantes et fluides caloporteurs"
    },
    packagings: [{ type: "BOUTEILLE", volume: 1, weight: 1, numero: "1" }],
    weight: { value: 1, isEstimate: true },
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

  it("exige les champs obligatoires de l'onglet déchet", () => {
    const result = parse({ waste: null, packagings: [], weight: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join("."))).toEqual(
        expect.arrayContaining([
          "waste.code",
          "waste.description",
          "packagings",
          "weight.value"
        ])
      );
    }
  });

  describe("onglet détenteur différent", () => {
    const equipmentHolder = {
      numero: "DETENTEUR_1",
      holderType: "ENTREPRISE",
      detenteur: {
        isPrivateIndividual: false,
        company: {
          siret: "11111111111111",
          contact: "Jean Dupont",
          phone: "0102030405",
          mail: "jean@example.com"
        }
      },
      packagings: [{ numero: "1" }]
    };

    it("accepte un détenteur complet couvrant tous les contenants", () => {
      expect(
        parse({
          equipmentHolderDifferent: true,
          ficheInterventions: [equipmentHolder]
        }).success
      ).toBe(true);
    });

    it("exige au moins un détenteur", () => {
      const result = parse({
        equipmentHolderDifferent: true,
        ficheInterventions: []
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.map(issue => issue.path.join("."))
        ).toContain("ficheInterventions");
      }
    });

    it("refuse un contenant ou un détenteur sans rattachement", () => {
      const result = parse({
        equipmentHolderDifferent: true,
        packagings: [
          { type: "BOUTEILLE", volume: 1, weight: 1, numero: "1" },
          { type: "BOUTEILLE", volume: 1, weight: 1, numero: "2" }
        ],
        ficheInterventions: [{ ...equipmentHolder, packagings: [] }]
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(issue => issue.message);
        expect(messages).toEqual(
          expect.arrayContaining([
            "Au moins un contenant doit être rattaché à ce détenteur",
            "Le contenant #1 n'a pas été affecté à un détenteur",
            "Le contenant #2 n'a pas été affecté à un détenteur"
          ])
        );
      }
    });

    it.each([
      ["NAVIRE", "OMI1234567"],
      ["ASSOCIATION", "W123456789"]
    ])("valide l'identification du type %s", (holderType, identification) => {
      expect(
        parse({
          equipmentHolderDifferent: true,
          ficheInterventions: [
            {
              ...equipmentHolder,
              holderType,
              identification,
              detenteur: {
                isPrivateIndividual: true,
                company: equipmentHolder.detenteur.company
              }
            }
          ]
        }).success
      ).toBe(true);
    });
  });
});
