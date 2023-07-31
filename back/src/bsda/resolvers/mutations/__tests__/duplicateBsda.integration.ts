import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { gql } from "graphql-tag";
import { Prisma } from "@prisma/client";
import prisma from "../../../../prisma";
import { xDaysAgo } from "../../../../commands/onboarding.helpers";
import { bsdaFactory } from "../../../__tests__/factories";

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

export const DUPLICATE_BSDA = gql`
  mutation DuplicateBsda($id: ID!) {
    duplicateBsda(id: $id) {
      id
    }
  }
`;

async function createBsda(opt: Partial<Prisma.BsdaCreateInput> = {}) {
  // Companies with their initial data
  const emitter = await userWithCompanyFactory();
  const transporter = await userWithCompanyFactory("ADMIN", {
    transporterReceiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
    transporterReceiptValidityLimit: TODAY.toISOString() as any,
    transporterReceiptDepartment: "TRANSPORTER- RECEIPT-DEPARTMENT"
  });

  const broker = await userWithCompanyFactory("ADMIN", {
    brokerReceiptNumber: "BROKER-RECEIPT-NUMBER",
    brokerReceiptValidityLimit: TODAY.toISOString() as any,
    brokerReceiptDepartment: "BROKER-RECEIPT-DEPARTMENT"
  });

  const worker = await userWithCompanyFactory("ADMIN", {
    workerCertificationHasSubSectionFour: true,
    workerCertificationHasSubSectionThree: true,
    workerCertificationNumber: "WORKER-CERTIFICATION-NBR",
    workerCertificationValidityLimit: TODAY.toISOString() as any,
    workerCertificationOrganisation: "GLOBAL CERTIFICATION"
  });

  const destination = await userWithCompanyFactory();

  const bsda = await bsdaFactory({
    opt: {
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyName: emitter.company.name,
      emitterCompanyAddress: emitter.company.address,
      emitterCompanyContact: emitter.company.contact,
      emitterCompanyPhone: emitter.company.contactPhone,
      emitterCompanyMail: emitter.company.contactEmail,
      workerCompanySiret: worker.company.siret,
      workerCompanyName: worker.company.name,
      workerCompanyAddress: worker.company.address,
      workerCompanyContact: worker.company.contact,
      workerCompanyPhone: worker.company.contactPhone,
      workerCompanyMail: worker.company.contactEmail,
      workerCertificationCertificationNumber:
        worker.company.workerCertificationNumber,
      workerCertificationHasSubSectionFour:
        worker.company.workerCertificationHasSubSectionFour,
      workerCertificationOrganisation:
        worker.company.workerCertificationOrganisation,
      workerCertificationHasSubSectionThree:
        worker.company.workerCertificationHasSubSectionThree,
      workerCertificationValidityLimit:
        worker.company.workerCertificationValidityLimit,
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyName: transporter.company.name,
      transporterCompanyAddress: transporter.company.address,
      transporterCompanyContact: transporter.company.contact,
      transporterCompanyPhone: transporter.company.contactPhone,
      transporterCompanyMail: transporter.company.contactEmail,
      transporterRecepisseNumber: transporter.company.transporterReceiptNumber,
      transporterRecepisseDepartment:
        transporter.company.transporterReceiptDepartment,
      transporterRecepisseValidityLimit:
        transporter.company.transporterReceiptValidityLimit,
      destinationCompanySiret: destination.company.siret,
      destinationCompanyName: destination.company.name,
      destinationCompanyAddress: destination.company.address,
      destinationCompanyContact: destination.company.contact,
      destinationCompanyPhone: destination.company.contactPhone,
      destinationCompanyMail: destination.company.contactEmail,
      brokerCompanySiret: broker.company.siret,
      brokerCompanyName: broker.company.name,
      brokerCompanyAddress: broker.company.address,
      brokerCompanyContact: broker.company.contact,
      brokerCompanyPhone: broker.company.contactPhone,
      brokerCompanyMail: broker.company.contactEmail,
      brokerRecepisseNumber: broker.company.brokerReceiptNumber,
      brokerRecepisseDepartment: broker.company.brokerReceiptDepartment,
      brokerRecepisseValidityLimit: broker.company.brokerReceiptValidityLimit,
      ...opt
    }
  });

  return { bsda, emitter, transporter, broker, worker, destination };
}

describe("Mutation.Bsda.duplicate", () => {
  afterEach(resetDatabase);

  test("should duplicate a bsda", async () => {
    // Given
    const { emitter, bsda } = await createBsda();
    const { mutate } = makeClient(emitter.user);

    const { errors, data } = await mutate<Pick<Mutation, "duplicateBsda">>(
      DUPLICATE_BSDA,
      {
        variables: {
          id: bsda.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    const duplicatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: data.duplicateBsda.id }
    });

    const {
      type,
      emitterIsPrivateIndividual,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      emitterPickupSiteName,
      emitterPickupSiteAddress,
      emitterPickupSiteCity,
      emitterPickupSitePostalCode,
      emitterPickupSiteInfos,
      ecoOrganismeName,
      ecoOrganismeSiret,
      wasteCode,
      wasteFamilyCode,
      wasteMaterialName,
      wasteConsistence,
      wasteAdr,
      wastePop,
      weightIsEstimate,
      brokerCompanyName,
      brokerCompanySiret,
      brokerCompanyAddress,
      brokerCompanyContact,
      brokerCompanyPhone,
      brokerCompanyMail,
      brokerRecepisseNumber,
      brokerRecepisseDepartment,
      brokerRecepisseValidityLimit,
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationCap,
      destinationPlannedOperationCode,
      destinationOperationNextDestinationCompanySiret,
      destinationOperationNextDestinationCompanyVatNumber,
      destinationOperationNextDestinationCompanyName,
      destinationOperationNextDestinationCompanyAddress,
      destinationOperationNextDestinationCompanyContact,
      destinationOperationNextDestinationCompanyPhone,
      destinationOperationNextDestinationCompanyMail,
      destinationOperationNextDestinationCap,
      destinationOperationNextDestinationPlannedOperationCode,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterCompanyVatNumber,
      transporterRecepisseIsExempted,
      transporterRecepisseNumber,
      transporterRecepisseDepartment,
      transporterRecepisseValidityLimit,
      transporterTransportMode,
      workerIsDisabled,
      workerCompanyName,
      workerCompanySiret,
      workerCompanyAddress,
      workerCompanyContact,
      workerCompanyPhone,
      workerCompanyMail,
      workerCertificationHasSubSectionFour,
      workerCertificationHasSubSectionThree,
      workerCertificationCertificationNumber,
      workerCertificationValidityLimit,
      workerCertificationOrganisation,
      ...rest
    } = bsda;

    const expectedSkipped = [
      "id",
      "createdAt",
      "updatedAt",
      "isDraft",
      "isDeleted",
      "status",
      "emitterEmissionSignatureAuthor",
      "emitterEmissionSignatureDate",
      "emitterCustomInfo",
      "workerWorkHasEmitterPaperSignature",
      "workerWorkSignatureAuthor",
      "workerWorkSignatureDate",
      "transporterTransportPlates",
      "transporterCustomInfo",
      "transporterTransportTakenOverAt",
      "transporterTransportSignatureAuthor",
      "transporterTransportSignatureDate",
      "destinationCustomInfo",
      "destinationReceptionWeight",
      "destinationReceptionDate",
      "destinationReceptionAcceptationStatus",
      "destinationReceptionRefusalReason",
      "destinationOperationCode",
      "destinationOperationDescription",
      "destinationOperationDate",
      "destinationOperationSignatureAuthor",
      "destinationOperationSignatureDate",
      "wasteSealNumbers",
      "packagings",
      "weightValue",
      "forwardingId",
      "groupedInId",
      "intermediariesOrgIds"
    ];

    expect(duplicatedBsda.status).toBe("INITIAL");
    expect(duplicatedBsda.isDraft).toBe(true);

    expect(duplicatedBsda).toMatchObject({
      type,
      emitterIsPrivateIndividual,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      emitterPickupSiteName,
      emitterPickupSiteAddress,
      emitterPickupSiteCity,
      emitterPickupSitePostalCode,
      emitterPickupSiteInfos,
      ecoOrganismeName,
      ecoOrganismeSiret,
      wasteCode,
      wasteFamilyCode,
      wasteMaterialName,
      wasteConsistence,
      wasteAdr,
      wastePop,
      weightIsEstimate,
      brokerCompanyName,
      brokerCompanySiret,
      brokerCompanyAddress,
      brokerCompanyContact,
      brokerCompanyPhone,
      brokerCompanyMail,
      brokerRecepisseNumber,
      brokerRecepisseDepartment,
      brokerRecepisseValidityLimit,
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationCap,
      destinationPlannedOperationCode,
      destinationOperationNextDestinationCompanySiret,
      destinationOperationNextDestinationCompanyVatNumber,
      destinationOperationNextDestinationCompanyName,
      destinationOperationNextDestinationCompanyAddress,
      destinationOperationNextDestinationCompanyContact,
      destinationOperationNextDestinationCompanyPhone,
      destinationOperationNextDestinationCompanyMail,
      destinationOperationNextDestinationCap,
      destinationOperationNextDestinationPlannedOperationCode,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterCompanyVatNumber,
      transporterRecepisseIsExempted,
      transporterRecepisseNumber,
      transporterRecepisseDepartment,
      transporterRecepisseValidityLimit,
      transporterTransportMode,
      workerIsDisabled,
      workerCompanyName,
      workerCompanySiret,
      workerCompanyAddress,
      workerCompanyContact,
      workerCompanyPhone,
      workerCompanyMail,
      workerCertificationHasSubSectionFour,
      workerCertificationHasSubSectionThree,
      workerCertificationCertificationNumber,
      workerCertificationValidityLimit,
      workerCertificationOrganisation
    });

    // make sure this test breaks when a new field is added to the Bsda model
    // it will ensure we think of adding necessary fields to the duplicate input
    const sortFn = (a: string, b: string) => a.localeCompare(b);
    expect(Object.keys(rest).sort(sortFn)).toEqual(
      expectedSkipped.sort(sortFn)
    );
  });

  test("duplicated BSDD should have the updated data when company info changes", async () => {
    // Given

    const { bsda, transporter, emitter, worker, broker } = await createBsda();

    await prisma.company.update({
      where: {
        id: transporter.company.id
      },
      data: {
        name: "UPDATED-TRANSPORTER-NAME",
        address: "UPDATED-TRANSPORTER-ADRESS",
        contact: "UPDATED-TRANSPORTER-CONTACT",
        contactPhone: "UPDATED-TRANSPORTER-PHONE",
        contactEmail: "UPDATED-TRANSPORTER-MAIL"
      }
    });

    await prisma.company.update({
      where: {
        id: transporter.company.id
      },
      data: {
        transporterReceiptNumber: "UPDATED-TRANSPORTER-RECEIPT-NUMBER",
        transporterReceiptValidityLimit: FOUR_DAYS_AGO.toISOString(),
        transporterReceiptDepartment: "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
      }
    });

    await prisma.company.update({
      where: {
        id: broker.company.id
      },
      data: {
        name: "UPDATED-BROKER-NAME",
        address: "UPDATED-BROKER-ADRESS",
        contact: "UPDATED-BROKER-CONTACT",
        contactPhone: "UPDATED-BROKER-PHONE",
        contactEmail: "UPDATED-BROKER-MAIL",
        brokerReceiptNumber: "UPDATED-BROKER-RECEIPT-NUMBER",
        brokerReceiptValidityLimit: FOUR_DAYS_AGO.toISOString(),
        brokerReceiptDepartment: "UPDATED-BROKER-RECEIPT-DEPARTMENT"
      }
    });

    await prisma.company.update({
      where: {
        id: emitter.company.id
      },
      data: {
        name: "UPDATED-EMITTER-NAME",
        address: "UPDATED-EMITTER-ADRESS",
        contact: "UPDATED-EMITTER-CONTACT",
        contactPhone: "UPDATED-EMITTER-PHONE",
        contactEmail: "UPDATED-EMITTER-MAIL"
      }
    });

    await prisma.company.update({
      where: {
        id: worker.company.id
      },
      data: {
        name: "UPDATED-WORKER-NAME",
        address: "UPDATED-WORKER-ADRESS",
        contact: "UPDATED-WORKER-CONTACT",
        contactPhone: "UPDATED-WORKER-PHONE",
        contactEmail: "UPDATED-WORKER-MAIL",
        workerCertificationHasSubSectionFour: false,
        workerCertificationHasSubSectionThree: false,
        workerCertificationNumber: "UPDATED-WORKER-CERTIFICATION-NBR",
        workerCertificationValidityLimit: FOUR_DAYS_AGO.toISOString() as any,
        workerCertificationOrganisation: "AFNOR Certification"
      }
    });

    const { mutate } = makeClient(emitter.user);

    const { errors, data } = await mutate<Pick<Mutation, "duplicateBsda">>(
      DUPLICATE_BSDA,
      {
        variables: {
          id: bsda.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const duplicatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: data.duplicateBsda.id }
    });

    // Check transporter info is updated
    expect(duplicatedBsda.transporterCompanyName).toEqual(
      "UPDATED-TRANSPORTER-NAME"
    );
    expect(duplicatedBsda.transporterCompanyAddress).toEqual(
      "UPDATED-TRANSPORTER-ADRESS"
    );
    expect(duplicatedBsda.transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(duplicatedBsda.transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );
    expect(duplicatedBsda.transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(duplicatedBsda.transporterRecepisseDepartment).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
    );
    expect(duplicatedBsda.transporterRecepisseValidityLimit).toEqual(
      FOUR_DAYS_AGO
    );
    expect(duplicatedBsda.transporterRecepisseNumber).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-NUMBER"
    );

    // Check broker info is updated
    expect(duplicatedBsda.brokerCompanyName).toEqual("UPDATED-BROKER-NAME");
    expect(duplicatedBsda.brokerCompanyAddress).toEqual(
      "UPDATED-BROKER-ADRESS"
    );
    expect(duplicatedBsda.brokerCompanyContact).toEqual(
      "UPDATED-BROKER-CONTACT"
    );
    expect(duplicatedBsda.brokerCompanyPhone).toEqual("UPDATED-BROKER-PHONE");
    expect(duplicatedBsda.brokerCompanyMail).toEqual("UPDATED-BROKER-MAIL");
    expect(duplicatedBsda.brokerRecepisseDepartment).toEqual(
      "UPDATED-BROKER-RECEIPT-DEPARTMENT"
    );
    expect(duplicatedBsda.brokerRecepisseValidityLimit).toEqual(FOUR_DAYS_AGO);
    expect(duplicatedBsda.brokerRecepisseNumber).toEqual(
      "UPDATED-BROKER-RECEIPT-NUMBER"
    );

    // Check emitter info is updated
    expect(duplicatedBsda.emitterCompanyName).toEqual("UPDATED-EMITTER-NAME");
    expect(duplicatedBsda.emitterCompanyAddress).toEqual(
      "UPDATED-EMITTER-ADRESS"
    );
    expect(duplicatedBsda.emitterCompanyContact).toEqual(
      "UPDATED-EMITTER-CONTACT"
    );
    expect(duplicatedBsda.emitterCompanyPhone).toEqual("UPDATED-EMITTER-PHONE");
    expect(duplicatedBsda.emitterCompanyMail).toEqual("UPDATED-EMITTER-MAIL");

    // Check worker info is updated
    expect(duplicatedBsda.workerCompanyName).toEqual("UPDATED-WORKER-NAME");
    expect(duplicatedBsda.workerCompanyAddress).toEqual(
      "UPDATED-WORKER-ADRESS"
    );
    expect(duplicatedBsda.workerCompanyContact).toEqual(
      "UPDATED-WORKER-CONTACT"
    );
    expect(duplicatedBsda.workerCompanyPhone).toEqual("UPDATED-WORKER-PHONE");
    expect(duplicatedBsda.workerCompanyMail).toEqual("UPDATED-WORKER-MAIL");

    expect(duplicatedBsda.workerCertificationHasSubSectionFour).toEqual(false);
    expect(duplicatedBsda.workerCertificationHasSubSectionThree).toEqual(false);
    expect(duplicatedBsda.workerCertificationCertificationNumber).toEqual(
      "UPDATED-WORKER-CERTIFICATION-NBR"
    );
    expect(duplicatedBsda.workerCertificationValidityLimit).toEqual(
      FOUR_DAYS_AGO
    );
    expect(duplicatedBsda.workerCertificationOrganisation).toEqual(
      "AFNOR Certification"
    );
    // Test emptying Transporter receipt
    await prisma.company.update({
      where: { id: transporter.company.id },
      data: {
        transporterReceiptDepartment: null,
        transporterReceiptNumber: null,
        transporterReceiptValidityLimit: null
      }
    });
    const { errors: err3, data: data2 } = await mutate<
      Pick<Mutation, "duplicateBsda">
    >(DUPLICATE_BSDA, {
      variables: {
        id: bsda.id
      }
    });

    // Then
    expect(err3).toBeUndefined();

    const duplicatedBsda2 = await prisma.bsda.findUniqueOrThrow({
      where: { id: data2.duplicateBsda.id }
    });
    expect(duplicatedBsda2.transporterRecepisseNumber).toBeNull();
    expect(duplicatedBsda2.transporterRecepisseValidityLimit).toBeNull();
    expect(duplicatedBsda2.transporterRecepisseDepartment).toBeNull();
  });
});
