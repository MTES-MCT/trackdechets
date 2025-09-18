import { BsffFicheIntervention, Prisma } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory } from "../../__tests__/factories";
import { ficheInterventionSchema } from "../validation";

describe("ficheInterventionSchema", () => {
  let ficheInteventionData: Partial<BsffFicheIntervention>,
    detenteurCompanyData: Partial<BsffFicheIntervention>,
    privateIndividualData: Partial<BsffFicheIntervention>;

  afterAll(resetDatabase);

  beforeAll(async () => {
    const operateurCompany = await companyFactory({
      companyTypes: ["PRODUCER"]
    });

    const detenteurCompany = await companyFactory({
      companyTypes: ["PRODUCER"]
    });

    ficheInteventionData = {
      numero: "FI-1",
      weight: new Prisma.Decimal(1),
      postalCode: "13001",

      operateurCompanyName: "Operateur",
      operateurCompanySiret: operateurCompany.siret!,
      operateurCompanyAddress: "Quelque part",
      operateurCompanyContact: "Arya Stark",
      operateurCompanyPhone: "01 00 00 00 00",
      operateurCompanyMail: "arya.stark@trackdechets.fr"
    };

    detenteurCompanyData = {
      detenteurCompanyName: "Detenteur",
      detenteurCompanySiret: detenteurCompany.siret,
      detenteurCompanyAddress: "Quelque part",
      detenteurCompanyContact: "John Snow",
      detenteurCompanyPhone: "00 00 00 00 00",
      detenteurCompanyMail: "john.snow@trackdechets.fr"
    };

    privateIndividualData = {
      detenteurIsPrivateIndividual: true,
      detenteurCompanySiret: null,
      detenteurCompanyContact: null,
      detenteurCompanyName: "John Snow",
      detenteurCompanyAddress: "Quelque part",
      detenteurCompanyMail: "john.snow@trackdechets.fr",
      detenteurCompanyPhone: "00 00 00 00 00"
    };
  });

  it("should be valid when company info is complete", () => {
    expect(
      ficheInterventionSchema.isValidSync({
        ...ficheInteventionData,
        ...detenteurCompanyData
      })
    ).toBe(true);
  });

  it("should be invalid when a company field is missing", async () => {
    const data = {
      ...ficheInteventionData,
      ...detenteurCompanyData,
      detenteurCompanyContact: null
    };
    const validateFn = () => ficheInterventionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Le nom du contact de l'entreprise détentrice de l'équipement est requis"
    );
  });

  it("should be valid when private individual info is complete", () => {
    expect(
      ficheInterventionSchema.isValidSync({
        ...ficheInteventionData,
        ...privateIndividualData
      })
    ).toBe(true);
  });

  it("should be invalid when a private individual field is missing", async () => {
    const data = {
      ...ficheInteventionData,
      ...privateIndividualData,
      detenteurCompanyAddress: null
    };
    const validateFn = () => ficheInterventionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "L'adresse du détenteur de l'équipement (particulier) est requise"
    );
  });

  it("should not be valid when providing both company and private indivual info", async () => {
    const data = {
      ...ficheInteventionData,
      ...privateIndividualData,
      ...detenteurCompanyData
    };
    const validateFn = () => ficheInterventionSchema.validate(data);
    await expect(validateFn()).rejects.toThrow(
      "Détenteur : vous ne pouvez pas renseigner de SIRET lorsque l'émetteur ou le détenteur est un particulier"
    );
  });
});
