import {
  destinationCompanySiretSchema,
  transporterCompanySiretSchema
} from "../validation";
import * as yup from "yup";
import configureYup from "../../common/yup/configureYup";
import { companyFactory } from "../../__tests__/factories";
import { CompanyType } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";

configureYup();

describe("destinationCompanySiretSchema", () => {
  afterAll(resetDatabase);

  it("should be invalid when siret is not well formatted", async () => {
    const schema = yup.object({
      destinationCompanySiret: destinationCompanySiretSchema()
    });
    const siret = "1";
    const validateFn = () =>
      schema.validate({ destinationCompanySiret: siret });
    await expect(validateFn()).rejects.toThrow("Destinataire : SIRET invalide");
  });

  it("should be invalid when company does not exist in TD", async () => {
    const schema = yup.object({
      destinationCompanySiret: destinationCompanySiretSchema()
    });
    const siret = "11111111111111";
    const validateFn = () =>
      schema.validate({ destinationCompanySiret: siret });
    await expect(validateFn()).rejects.toThrow(
      `L'installation de destination avec le SIRET ${siret} n'est pas inscrite sur Trackdéchets`
    );
  });

  it("should be invalid when company exists but does not have the right profile", async () => {
    const company = await companyFactory({
      companyTypes: [CompanyType.PRODUCER]
    });
    const schema = yup.object({
      destinationCompanySiret: destinationCompanySiretSchema()
    });
    const validateFn = () =>
      schema.validate({ destinationCompanySiret: company.siret });
    await expect(validateFn()).rejects.toThrow(
      "L'installation de destination ou d’entreposage ou de reconditionnement avec " +
        `le SIRET "${company.siret}" n\'est pas inscrite sur Trackdéchets en tant` +
        " qu'installation de traitement ou de tri transit regroupement. Cette installation" +
        " ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de " +
        "l'administrateur de cette installation pour qu'il modifie le profil de " +
        "l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
    );
  });

  it.each([
    CompanyType.WASTEPROCESSOR,
    CompanyType.COLLECTOR,
    CompanyType.WASTE_CENTER
  ])(
    "should be valid when company is registered with profile %p",
    async profile => {
      const company = await companyFactory({
        companyTypes: [profile]
      });
      const schema = yup.object({
        destinationCompanySiret: destinationCompanySiretSchema()
      });

      const isValidFn = () =>
        schema.isValid({ destinationCompanySiret: company.siret });
      expect(await isValidFn()).toEqual(true);
    }
  );

  it.each([null, undefined, ""])(
    "should be valid when SIRET is %p and isRequired=false",
    async value => {
      const schema = yup.object({
        destinationCompanySiret: destinationCompanySiretSchema(false)
      });

      expect(await schema.isValid({ destinationCompanySiret: value })).toEqual(
        true
      );
    }
  );

  it.each([null, undefined, ""])(
    "should be invalid when SIRET is %p and isRequired=true",
    async value => {
      const schema = yup.object({
        destinationCompanySiret: destinationCompanySiretSchema(true)
      });
      const validateFn = () =>
        schema.validate({ destinationCompanySiret: value });
      expect(validateFn()).rejects.toThrow(
        "Destinataire : le n°SIRET est un champ requis"
      );
    }
  );
});

describe("destinationCompanySiretSchema", () => {
  afterAll(resetDatabase);

  it("should be invalid when siret is not well formatted", async () => {
    const schema = yup.object({
      transporterCompanySiret: transporterCompanySiretSchema()
    });
    const siret = "1";
    const validateFn = () =>
      schema.validate({ transporterCompanySiret: siret });
    await expect(validateFn()).rejects.toThrow("Transporteur : SIRET invalide");
  });

  it("should be invalid when company does not exist in TD", async () => {
    const schema = yup.object({
      transporterCompanySiret: transporterCompanySiretSchema()
    });
    const siret = "11111111111111";
    const validateFn = () =>
      schema.validate({ transporterCompanySiret: siret });
    await expect(validateFn()).rejects.toThrow(
      `Le transporteur qui a été renseigné sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets`
    );
  });

  it("should be invalid when company exists but does not have the right profile", async () => {
    const company = await companyFactory({
      companyTypes: [CompanyType.PRODUCER]
    });
    const schema = yup.object({
      transporterCompanySiret: transporterCompanySiretSchema()
    });
    const validateFn = () =>
      schema.validate({ transporterCompanySiret: company.siret });
    await expect(validateFn()).rejects.toThrow(
      `Le transporteur saisi sur le bordereau (SIRET: ${company.siret}) n'est pas inscrit` +
        " sur Trackdéchets en tant qu'entreprise de transport. Cette entreprise ne peut" +
        " donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur" +
        " de cette entreprise pour qu'il modifie le profil de l'établissement depuis l'interface" +
        " Trackdéchets Mon Compte > Établissements"
    );
  });

  it("should be valid when company is registered with profile TRANSPORTER", async () => {
    const company = await companyFactory({
      companyTypes: [CompanyType.TRANSPORTER]
    });
    const schema = yup.object({
      transporterCompanySiret: transporterCompanySiretSchema()
    });

    const isValidFn = () =>
      schema.isValid({ transporterCompanySiret: company.siret });
    expect(await isValidFn()).toEqual(true);
  });

  it.each([null, undefined, ""])(
    "should be invalid when SIRET is %p and isRequired=true",
    async value => {
      const schema = yup.object({
        transporterCompanySiret: transporterCompanySiretSchema(true)
      });
      const validateFn = () =>
        schema.validate({ transporterCompanySiret: value });
      expect(validateFn()).rejects.toThrow(
        "Transporteur : Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire"
      );
    }
  );

  it("should be valid when isRequired=true, siret nullish but a transporter VAT number is specified", async () => {
    const company = await companyFactory({
      companyTypes: [CompanyType.TRANSPORTER],
      siret: "DE811569869",
      vatNumber: "DE811569869"
    });
    const schema = yup.object({
      transporterCompanySiret: transporterCompanySiretSchema(true)
    });

    const isValidFn = () =>
      schema.isValid({
        transporterCompanySiret: null,
        transporterCompanyVatNumber: company.vatNumber
      });
    expect(await isValidFn()).toEqual(true);
  });
});
