import { destinationCompanySiretSchema } from "../validation";
import * as yup from "yup";
import configureYup from "../../common/yup/configureYup";
import { companyFactory } from "../../__tests__/factories";
import { CompanyType } from "@prisma/client";

configureYup();

describe("destinationCompanySiretSchema", () => {
  it("should be invalid when siret is not well formatted", async () => {
    const schema = yup.object({
      destinationCompanySiret: destinationCompanySiretSchema()
    });
    const siret = "1";
    const validateFn = () =>
      schema.validate({ destinationCompanySiret: siret });
    await expect(validateFn()).rejects.toThrow(
      "Destinataire: Le SIRET doit faire 14 caractères numériques"
    );
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
