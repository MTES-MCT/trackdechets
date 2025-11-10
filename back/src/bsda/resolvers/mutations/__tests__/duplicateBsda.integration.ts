import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import type { CompanySearchResult, Mutation } from "@td/codegen-back";
import { gql } from "graphql-tag";
import { Prisma } from "@td/prisma";
import { prisma } from "@td/prisma";
import { xDaysAgo } from "../../../../utils";
import { bsdaFactory } from "../../../__tests__/factories";
import { searchCompany } from "../../../../companies/search";
import { getFirstTransporterSync } from "../../../database";

jest.mock("../../../../companies/search");

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

export const DUPLICATE_BSDA = gql`
  mutation DuplicateBsda($id: ID!) {
    duplicateBsda(id: $id) {
      id
      isDuplicateOf
    }
  }
`;

async function createBsda(opt: Partial<Prisma.BsdaCreateInput> = {}) {
  // Companies with their initial data
  const emitter = await userWithCompanyFactory();
  const transporter = await userWithCompanyFactory("ADMIN", {
    transporterReceipt: {
      create: {
        receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
        validityLimit: TODAY.toISOString() as any,
        department: "TRANSPORTER- RECEIPT-DEPARTMENT"
      }
    }
  });
  const transporterReceipt = await prisma.transporterReceipt.findUniqueOrThrow({
    where: { id: transporter.company.transporterReceiptId! }
  });
  const broker = await userWithCompanyFactory("ADMIN", {
    companyTypes: ["BROKER"],
    brokerReceipt: {
      create: {
        receiptNumber: "BROKER-RECEIPT-NUMBER",
        validityLimit: TODAY.toISOString() as any,
        department: "BROKER-RECEIPT-DEPARTMENT"
      }
    }
  });
  const brokerReceipt = await prisma.brokerReceipt.findUniqueOrThrow({
    where: { id: broker.company.brokerReceiptId! }
  });
  const worker = await userWithCompanyFactory("ADMIN", {
    workerCertification: {
      create: {
        hasSubSectionFour: true,
        hasSubSectionThree: true,
        certificationNumber: "WORKER-CERTIFICATION-NBR",
        validityLimit: TODAY.toISOString() as any,
        organisation: "GLOBAL CERTIFICATION"
      }
    }
  });
  const workerCertification =
    await prisma.workerCertification.findUniqueOrThrow({
      where: { id: worker.company.workerCertificationId! }
    });
  const destination = await userWithCompanyFactory();

  const bsda = await bsdaFactory({
    userId: emitter.user.id,
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
        workerCertification.certificationNumber,
      workerCertificationHasSubSectionFour:
        workerCertification.hasSubSectionFour,
      workerCertificationOrganisation: workerCertification.organisation,
      workerCertificationHasSubSectionThree:
        workerCertification.hasSubSectionThree,
      workerCertificationValidityLimit: workerCertification.validityLimit,
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
      brokerRecepisseNumber: brokerReceipt.receiptNumber,
      brokerRecepisseDepartment: brokerReceipt.department,
      brokerRecepisseValidityLimit: brokerReceipt.validityLimit,
      transportersOrgIds: [transporter.company.siret!],
      emitterEmissionSignatureDate: new Date(),
      emitterEmissionSignatureAuthor: "John",
      workerWorkSignatureDate: new Date(),
      workerWorkSignatureAuthor: "John",
      destinationOperationSignatureDate: new Date(),
      destinationOperationSignatureAuthor: "John",
      destinationReceptionSignatureDate: new Date(),
      destinationReceptionSignatureAuthor: "John",
      ...opt
    },
    transporterOpt: {
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyName: transporter.company.name,
      transporterCompanyAddress: transporter.company.address,
      transporterCompanyContact: transporter.company.contact,
      transporterCompanyPhone: transporter.company.contactPhone,
      transporterCompanyMail: transporter.company.contactEmail,
      transporterRecepisseNumber: transporterReceipt.receiptNumber,
      transporterRecepisseDepartment: transporterReceipt.department,
      transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
      transporterTransportSignatureDate: new Date(),
      transporterTransportSignatureAuthor: "John"
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
    expect(data.duplicateBsda.isDuplicateOf).toEqual(bsda.id);
    const duplicatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: data.duplicateBsda.id },
      include: { transporters: true }
    });

    const duplicatedTransporter = getFirstTransporterSync(duplicatedBsda)!;

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
      wasteConsistenceDescription,
      wasteIsSubjectToADR,
      wasteAdr,
      wasteNonRoadRegulationMention,
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
      transporterTransportSignatureDate,
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
      transportersOrgIds,
      ...rest
    } = bsda;

    const transporter = getFirstTransporterSync(bsda)!;

    const {
      transporterCompanySiret,
      transporterCompanyName,
      transporterCompanyVatNumber,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterRecepisseIsExempted,
      transporterRecepisseNumber,
      transporterRecepisseDepartment,
      transporterRecepisseValidityLimit,
      transporterTransportMode,
      ...restTransporter
    } = transporter;

    const expectedSkipped = [
      "id",
      "createdAt",
      "updatedAt",
      "rowNumber",
      "isDraft",
      "isDeleted",
      "status",
      "isDuplicateOf",
      "emitterEmissionSignatureAuthor",
      "emitterEmissionSignatureDate",
      "emitterCustomInfo",
      "workerWorkHasEmitterPaperSignature",
      "workerWorkSignatureAuthor",
      "workerWorkSignatureDate",
      "destinationCustomInfo",
      "destinationReceptionWeight",
      "destinationReceptionWeightIsEstimate",
      "destinationReceptionRefusedWeight",
      "destinationReceptionDate",
      "destinationReceptionAcceptationStatus",
      "destinationReceptionRefusalReason",
      "destinationOperationCode",
      "destinationOperationMode",
      "destinationOperationDescription",
      "destinationOperationDate",
      "destinationOperationSignatureAuthor",
      "destinationOperationSignatureDate",
      "destinationReceptionSignatureAuthor",
      "destinationReceptionSignatureDate",
      "wasteSealNumbers",
      "packagings",
      "weightValue",
      "forwarding",
      "forwardingId",
      "grouping",
      "groupedInId",
      "intermediaries",
      "intermediariesOrgIds",
      "canAccessDraftOrgIds",
      "transporters"
    ];

    const expectedSkippedTransporter = [
      "id",
      "createdAt",
      "updatedAt",
      "bsdaId",
      "transporterTransportPlates",
      "number",
      "transporterTransportTakenOverAt",
      "transporterTransportSignatureAuthor",
      "transporterTransportSignatureDate",
      "transporterCustomInfo"
    ];

    expect(duplicatedBsda.status).toBe("INITIAL");
    expect(duplicatedBsda.isDraft).toBe(true);

    expect(duplicatedBsda).toMatchObject({
      type,
      isDuplicateOf: bsda.id,
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
      wasteConsistenceDescription,
      wasteIsSubjectToADR,
      wasteAdr,
      wasteNonRoadRegulationMention,
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
      transportersOrgIds
    });

    expect(duplicatedTransporter).toMatchObject({
      number: 1,
      transporterCompanySiret,
      transporterCompanyName,
      transporterCompanyVatNumber,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterRecepisseIsExempted,
      transporterRecepisseNumber,
      transporterRecepisseDepartment,
      transporterRecepisseValidityLimit,
      transporterTransportMode
    });

    // make sure this test breaks when a new field is added to the Bsda model
    // it will ensure we think of adding necessary fields to the duplicate input
    const sortFn = (a: string, b: string) => a.localeCompare(b);
    expect(Object.keys(rest).sort(sortFn)).toEqual(
      expectedSkipped.sort(sortFn)
    );

    expect(Object.keys(restTransporter).sort(sortFn)).toEqual(
      expectedSkippedTransporter.sort(sortFn)
    );

    // Vérifie que les champs signatures ne sont pas dupliqués
    expect(duplicatedBsda.emitterEmissionSignatureDate).toBeNull();
    expect(duplicatedBsda.emitterEmissionSignatureAuthor).toBeNull();
    expect(duplicatedBsda.workerWorkSignatureDate).toBeNull();
    expect(duplicatedBsda.workerWorkSignatureAuthor).toBeNull();
    expect(duplicatedBsda.destinationOperationSignatureDate).toBeNull();
    expect(duplicatedBsda.destinationOperationSignatureAuthor).toBeNull();
    expect(duplicatedBsda.transportersOrgIds).toEqual([
      transporterCompanySiret
    ]);
    expect(duplicatedTransporter.transporterTransportSignatureDate).toBeNull();
    expect(
      duplicatedTransporter.transporterTransportSignatureAuthor
    ).toBeNull();
  });

  it("should duplicate a BSDA COLLECTION_2710 with no transporters", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        type: "COLLECTION_2710",
        workerCompanySiret: null,
        workerCompanyName: null,
        emitterCompanySiret: emitter.company.siret,
        // no transporters
        transporters: {}
      }
    });
    const { mutate } = makeClient(emitter.user);

    const { data, errors } = await mutate<Pick<Mutation, "duplicateBsda">>(
      DUPLICATE_BSDA,
      {
        variables: {
          id: bsda.id
        }
      }
    );

    const duplicated = await prisma.bsda.findUniqueOrThrow({
      where: { id: data.duplicateBsda.id },
      include: { transporters: true }
    });

    expect(errors).toBeUndefined();
    expect(duplicated.transporters).toEqual([]);
  });

  test("duplicated BSDA should have the updated data when company info changes", async () => {
    // Given
    const { bsda, transporter, emitter, worker, broker } = await createBsda();

    // On s'assure que toutes les signatures sont nulles pour ne pas que l'auto-complétion
    // soit sautée pour cause de champ verrouillé
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        emitterEmissionSignatureDate: null,
        workerWorkSignatureDate: null,
        destinationOperationSignatureDate: null,
        transporters: {
          updateMany: {
            data: { transporterTransportSignatureDate: null },
            where: {}
          }
        }
      }
    });

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
        transporterReceipt: {
          update: {
            receiptNumber: "UPDATED-TRANSPORTER-RECEIPT-NUMBER",
            validityLimit: FOUR_DAYS_AGO.toISOString(),
            department: "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
          }
        }
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
        brokerReceipt: {
          update: {
            receiptNumber: "UPDATED-BROKER-RECEIPT-NUMBER",
            validityLimit: FOUR_DAYS_AGO.toISOString(),
            department: "UPDATED-BROKER-RECEIPT-DEPARTMENT"
          }
        }
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
        workerCertification: {
          update: {
            hasSubSectionFour: false,
            hasSubSectionThree: false,
            certificationNumber: "UPDATED-WORKER-CERTIFICATION-NBR",
            validityLimit: FOUR_DAYS_AGO.toISOString() as any,
            organisation: "AFNOR Certification"
          }
        }
      }
    });

    // No SIRENE data, just return DB objects
    (searchCompany as jest.Mock).mockImplementation(async (clue: string) => {
      const company = await prisma.company.findFirstOrThrow({
        where: { orgId: clue },
        include: {
          transporterReceipt: true,
          brokerReceipt: true,
          workerCertification: true
        }
      });

      return {
        name: company.name,
        address: company.address,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
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
      where: { id: data.duplicateBsda.id },
      include: { transporters: true }
    });

    const duplicatedTransporter = getFirstTransporterSync(duplicatedBsda)!;

    // Check transporter info is updated
    expect(duplicatedTransporter.transporterCompanyName).toEqual(
      "UPDATED-TRANSPORTER-NAME"
    );
    expect(duplicatedTransporter.transporterCompanyAddress).toEqual(
      "UPDATED-TRANSPORTER-ADRESS"
    );
    expect(duplicatedTransporter.transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(duplicatedTransporter.transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );
    expect(duplicatedTransporter.transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(duplicatedTransporter.transporterRecepisseDepartment).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
    );
    expect(duplicatedTransporter.transporterRecepisseValidityLimit).toEqual(
      FOUR_DAYS_AGO
    );
    expect(duplicatedTransporter.transporterRecepisseNumber).toEqual(
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
    await prisma.transporterReceipt.delete({
      where: { id: transporter.company.transporterReceiptId! }
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
      where: { id: data2.duplicateBsda.id },
      include: { transporters: true }
    });
    const duplicatedTransporter2 = getFirstTransporterSync(duplicatedBsda2)!;

    expect(duplicatedTransporter2.transporterRecepisseNumber).toBeNull();
    expect(duplicatedTransporter2.transporterRecepisseValidityLimit).toBeNull();
    expect(duplicatedTransporter2.transporterRecepisseDepartment).toBeNull();
  });

  test("duplicated BSDA should have the sirenified data when company info changes", async () => {
    // Given
    const intermediary1 = await userWithCompanyFactory("MEMBER");
    const intermediary2 = await userWithCompanyFactory("MEMBER");
    const { bsda, transporter, emitter, worker, broker, destination } =
      await createBsda({
        intermediaries: {
          createMany: {
            data: [
              {
                siret: intermediary1.company.siret ?? "",
                contact: "Mr intermédiaire 1",
                name: intermediary1.company.name,
                address: "Nawak"
              },
              {
                siret: intermediary2.company.siret ?? "",
                contact: "Mr intermédiaire 2",
                name: intermediary1.company.name,
                address: "Nawak"
              }
            ]
          }
        }
      });

    // On s'assure que toutes les signatures sont nulles pour ne pas que l'auto-complétion
    // soit sautée pour cause de champ verrouillé
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        emitterEmissionSignatureDate: null,
        workerWorkSignatureDate: null,
        destinationOperationSignatureDate: null,
        transporters: {
          updateMany: {
            data: { transporterTransportSignatureDate: null },
            where: {}
          }
        }
      }
    });

    function searchResult(companyName: string) {
      return {
        name: `updated ${companyName} name`,
        address: `updated ${companyName} address`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("emitter"),
      [transporter.company.siret!]: searchResult("transporter"),
      [destination.company.siret!]: searchResult("destination"),
      [worker.company.siret!]: searchResult("worker"),
      [intermediary1.company.siret!]: searchResult("intermediary1"),
      [intermediary2.company.siret!]: searchResult("intermediary2"),
      [broker.company.siret!]: searchResult("broker")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
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
      where: { id: data.duplicateBsda.id },
      include: { intermediaries: true, transporters: true }
    });

    const duplicatedTransporter = getFirstTransporterSync(duplicatedBsda)!;

    // Check transporter info is updated
    expect(duplicatedTransporter.transporterCompanyName).toEqual(
      "updated transporter name"
    );
    expect(duplicatedTransporter.transporterCompanyAddress).toEqual(
      "updated transporter address"
    );

    // Check broker info is updated
    expect(duplicatedBsda.brokerCompanyName).toEqual("updated broker name");
    expect(duplicatedBsda.brokerCompanyAddress).toEqual(
      "updated broker address"
    );

    // Check emitter info is updated
    expect(duplicatedBsda.emitterCompanyName).toEqual("updated emitter name");
    expect(duplicatedBsda.emitterCompanyAddress).toEqual(
      "updated emitter address"
    );

    // Check worker info is updated
    expect(duplicatedBsda.workerCompanyName).toEqual("updated worker name");
    expect(duplicatedBsda.workerCompanyAddress).toEqual(
      "updated worker address"
    );

    // Check destination info is updated
    expect(duplicatedBsda.destinationCompanyName).toEqual(
      "updated destination name"
    );
    expect(duplicatedBsda.destinationCompanyAddress).toEqual(
      "updated destination address"
    );

    // Intermediaries
    expect(duplicatedBsda.intermediaries[0].name).toEqual(
      "updated intermediary1 name"
    );
    expect(duplicatedBsda.intermediaries[0].address).toEqual(
      "updated intermediary1 address"
    );
    expect(duplicatedBsda.intermediaries[1].name).toEqual(
      "updated intermediary2 name"
    );
    expect(duplicatedBsda.intermediaries[1].address).toEqual(
      "updated intermediary2 address"
    );
  });
});
