import { CompanyType } from "@prisma/client";
import prisma from "../../prisma";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../__tests__/factories";
import { checkDestinations } from "../validation";

describe("checkDestinations", () => {
  it("should pass if destination in frame 2 if valid", async () => {
    const owner = await userFactory();
    const wasteProcessor = await companyFactory({
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
    });
    const form = await formFactory({
      ownerId: owner.id,
      opt: { recipientCompanySiret: wasteProcessor.siret }
    });
    expect(await checkDestinations(form)).toEqual(true);
  });

  it("should pass if destination in frame 2 and 14 are valid", async () => {
    const owner = await userFactory();
    const collector = await companyFactory({
      companyTypes: { set: [CompanyType.COLLECTOR] }
    });
    const wasteProcessor = await companyFactory({
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
    });
    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: { recipientCompanySiret: collector.siret }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: {
        temporaryStorageDetail: {
          update: { destinationCompanySiret: wasteProcessor.siret }
        }
      }
    });
    expect(await checkDestinations(form)).toEqual(true);
  });

  it("should throw an error if destination in frame 2 is not registered in TD", async () => {
    const owner = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { recipientCompanySiret: "11111111111111" }
    });
    const checkFn = () => checkDestinations(form);
    expect(checkFn()).rejects.toThrow(
      "L'installation de destination ou d’entreposage ou de reconditionnement prévue (cadre 2) n'est pas inscrite sur Trackdéchets"
    );
  });

  it("should throw an error if destination in frame 2 is not registered as waste processor or TTR", async () => {
    const owner = await userFactory();
    const producer = await companyFactory({
      companyTypes: { set: [CompanyType.PRODUCER] }
    });
    const form = await formFactory({
      ownerId: owner.id,
      opt: { recipientCompanySiret: producer.siret }
    });
    const checkFn = () => checkDestinations(form);
    expect(checkFn()).rejects.toThrow(
      `L'installation de destination ou d’entreposage ou de reconditionnement prévue ${producer.siret}
      n'est pas inscrite sur Trackdéchets en tant que qu'installation de traitement ou de tri transit regroupement.
      Cette installation ne peut donc pas être visée en case 2 du bordereau. Veuillez vous rapprocher de l'administrateur
      de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
    );
  });

  it("should throw an error if destination in frame 2 is not registered in TD", async () => {
    const owner = await userFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: { recipientCompanySiret: "11111111111111" }
    });
    const checkFn = () => checkDestinations(form);
    expect(checkFn()).rejects.toThrow(
      "L'installation de destination ou d’entreposage ou de reconditionnement prévue (cadre 2) n'est pas inscrite sur Trackdéchets"
    );
  });

  it("should throw an error if destination in frame 14 is not registered in TD", async () => {
    const owner = await userFactory();
    const collector = await companyFactory({
      companyTypes: { set: [CompanyType.COLLECTOR] }
    });
    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: { recipientCompanySiret: collector.siret }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: {
        temporaryStorageDetail: {
          update: { destinationCompanySiret: "11111111111111" }
        }
      }
    });
    const checkFn = () => checkDestinations(form);
    expect(checkFn()).rejects.toThrow(
      "L'installation de destination prévue après entreposage provisoire ou reconditionnement (cadre 14) n'est pas inscrite sur Trackdéchets"
    );
  });

  it("should throw an error if destination in frame 14 is not registered as waste processor or TTR", async () => {
    const owner = await userFactory();
    const collector = await companyFactory({
      companyTypes: { set: [CompanyType.COLLECTOR] }
    });
    const producer = await companyFactory({
      companyTypes: { set: [CompanyType.PRODUCER] }
    });
    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: { recipientCompanySiret: collector.siret }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: {
        temporaryStorageDetail: {
          update: { destinationCompanySiret: producer.siret }
        }
      }
    });
    const checkFn = () => checkDestinations(form);
    expect(checkFn()).rejects.toThrow(
      `L'installation de destination prévue après entreposage provisoire ou reconditionnement ${producer.siret}
      n'est pas inscrite sur Trackdéchets en tant que qu'installation de traitement ou de tri transit regroupement.
      Cette installation ne peut donc pas être visée en case 14 du bordereau. Veuillez vous rapprocher de l'administrateur
      de cette installation pour qu'il modifie le profil de l'installation depuis l'interface Trackdéchets Mon Compte > Établissements`
    );
  });
});
