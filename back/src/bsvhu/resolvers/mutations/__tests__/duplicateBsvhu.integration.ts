import { gql } from "graphql-tag";
import { xDaysAgo } from "../../../../utils";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  companyFactory,
  ecoOrganismeFactory,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsvhuFactory } from "../../../__tests__/factories.vhu";
import type { CompanySearchResult, Mutation } from "@td/codegen-back";
import { ErrorCode } from "../../../../common/errors";
import { prisma } from "@td/prisma";
import { searchCompany } from "../../../../companies/search";
import { getFirstTransporterSync } from "../../../database";

jest.mock("../../../../companies/search");

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

const DUPLICATE_BVHU = gql`
  mutation DuplicateBsvhu($id: ID!) {
    duplicateBsvhu(id: $id) {
      id
      status
      isDuplicateOf
    }
  }
`;

describe("mutation.duplicateBsvhu", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetModules();
  });

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_BVHU,
      {
        variables: {
          id: bsvhu.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should duplicate a BSVHU", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await companyFactory({
      transporterReceipt: {
        create: {
          receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
          validityLimit: TODAY.toISOString() as any,
          department: "TRANSPORTER- RECEIPT-DEPARTMENT"
        }
      }
    });
    const transporterReceipt =
      await prisma.transporterReceipt.findUniqueOrThrow({
        where: { id: transporter.transporterReceiptId! }
      });
    const destination = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
    });

    const intermediary = await companyFactory();

    const ecoOrganisme = await ecoOrganismeFactory({
      handle: { handleBsvhu: true },
      createAssociatedCompany: true
    });

    const broker = await companyFactory({
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
      where: { id: broker.brokerReceiptId! }
    });
    const trader = await companyFactory({
      companyTypes: ["TRADER"],
      traderReceipt: {
        create: {
          receiptNumber: "TRADER-RECEIPT-NUMBER",
          validityLimit: TODAY.toISOString() as any,
          department: "TRADER-RECEIPT-DEPARTMENT"
        }
      }
    });
    const traderReceipt = await prisma.traderReceipt.findUniqueOrThrow({
      where: { id: trader.traderReceiptId! }
    });

    const bsvhu = await bsvhuFactory({
      userId: emitter.user.id,
      opt: {
        emitterIrregularSituation: false,
        emitterNoSiret: false,
        emitterNotOnTD: false,
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        emitterCompanyContact: emitter.company.contact,
        emitterCompanyPhone: emitter.company.contactPhone,
        emitterCompanyMail: emitter.company.contactEmail,
        destinationCompanySiret: destination.siret,
        destinationCompanyName: destination.name,
        destinationCompanyAddress: destination.address,
        destinationCompanyContact: destination.contact,
        destinationCompanyPhone: destination.contactPhone,
        destinationCompanyMail: destination.contactEmail,
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret,
            transporterCompanyName: transporter.name,
            transporterCompanyAddress: transporter.address,
            transporterCompanyContact: transporter.contact,
            transporterCompanyPhone: transporter.contactPhone,
            transporterCompanyMail: transporter.contactEmail,
            transporterRecepisseIsExempted: false,
            transporterRecepisseNumber: transporterReceipt.receiptNumber,
            transporterRecepisseDepartment: transporterReceipt.department,
            transporterRecepisseValidityLimit: transporterReceipt.validityLimit
          }
        },
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "John",
        transporterTransportSignatureDate: new Date(),
        destinationReceptionSignatureDate: new Date(),
        destinationReceptionSignatureAuthor: "John",
        destinationReceptionDate: new Date(),
        destinationOperationSignatureDate: new Date(),
        destinationOperationSignatureAuthor: "John",
        intermediaries: {
          createMany: {
            data: [
              {
                siret: intermediary.siret ?? "",
                contact: "Mr intermédiaire 1",
                name: intermediary.name,
                address: "Nawak"
              }
            ]
          }
        },
        ecoOrganismeSiret: ecoOrganisme.siret,
        ecoOrganismeName: ecoOrganisme.name,
        brokerCompanyName: broker.name,
        brokerCompanySiret: broker.siret,
        brokerCompanyAddress: broker.address,
        brokerCompanyContact: broker.contact,
        brokerCompanyPhone: broker.contactPhone,
        brokerCompanyMail: broker.contactEmail,
        brokerRecepisseNumber: brokerReceipt.receiptNumber,
        brokerRecepisseDepartment: brokerReceipt.department,
        brokerRecepisseValidityLimit: brokerReceipt.validityLimit,
        traderCompanyName: trader.name,
        traderCompanySiret: trader.siret,
        traderCompanyAddress: trader.address,
        traderCompanyContact: trader.contact,
        traderCompanyPhone: trader.contactPhone,
        traderCompanyMail: trader.contactEmail,
        traderRecepisseNumber: traderReceipt.receiptNumber,
        traderRecepisseDepartment: traderReceipt.department,
        traderRecepisseValidityLimit: traderReceipt.validityLimit,
        containsElectricOrHybridVehicles: true
      }
    });

    const searchResults = {
      [emitter.company.siret!]: {
        ...emitter.company,
        isRegistered: true
      }
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });
    const { mutate } = makeClient(emitter.user);

    const { errors, data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: { id: bsvhu.id }
      }
    );
    expect(errors).toBeUndefined();
    const duplicatedBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: data.duplicateBsvhu.id },
      include: { intermediaries: true, transporters: true }
    });
    const duplicatedTransporter = getFirstTransporterSync(duplicatedBsvhu)!;

    const {
      emitterIrregularSituation,
      emitterNoSiret,
      emitterNotOnTD,
      emitterAgrementNumber,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyStreet,
      emitterCompanyCity,
      emitterCompanyPostalCode,
      emitterCompanyCountry,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      emitterCustomInfo,
      destinationType,
      destinationPlannedOperationCode,
      destinationAgrementNumber,
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationOperationNextDestinationCompanyName,
      destinationOperationNextDestinationCompanySiret,
      destinationOperationNextDestinationCompanyAddress,
      destinationOperationNextDestinationCompanyContact,
      destinationOperationNextDestinationCompanyPhone,
      destinationOperationNextDestinationCompanyMail,
      destinationOperationNextDestinationCompanyVatNumber,
      destinationOperationNextDestinationCompanyExtraEuropeanId,
      destinationOperationNextDestinationCompanyCountry,
      destinationCustomInfo,
      wasteCode,
      packaging,
      identificationNumbers,
      identificationType,
      quantity,
      weightValue,
      weightIsEstimate,
      ecoOrganismeSiret,
      ecoOrganismeName,
      brokerCompanyName,
      brokerCompanySiret,
      brokerCompanyAddress,
      brokerCompanyContact,
      brokerCompanyPhone,
      brokerCompanyMail,
      brokerRecepisseNumber,
      brokerRecepisseDepartment,
      brokerRecepisseValidityLimit,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderRecepisseNumber,
      traderRecepisseDepartment,
      traderRecepisseValidityLimit,
      containsElectricOrHybridVehicles,
      transportersOrgIds,
      ...rest
    } = bsvhu;
    const transporterFromBsvhu = getFirstTransporterSync(bsvhu)!;

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
    } = transporterFromBsvhu;
    const expectedSkipped = [
      "id",
      "customId",
      "createdAt",
      "updatedAt",
      "rowNumber",
      "isDraft",
      "isDeleted",
      "status",
      "isDuplicateOf",
      "emitterEmissionSignatureAuthor",
      "emitterEmissionSignatureDate",
      "transporterTransportSignatureDate",
      "destinationReceptionQuantity",
      "destinationReceptionWeight",
      "destinationReceptionAcceptationStatus",
      "destinationReceptionRefusalReason",
      "destinationReceptionSignatureAuthor",
      "destinationReceptionSignatureDate",
      "destinationReceptionIdentificationNumbers",
      "destinationReceptionIdentificationType",
      "destinationReceptionDate",
      "destinationOperationDate",
      "destinationOperationCode",
      "destinationOperationMode",
      "destinationOperationSignatureAuthor",
      "destinationOperationSignatureDate",
      "intermediaries",
      "intermediariesOrgIds",
      "canAccessDraftOrgIds",
      "transporters",

      // temporary, we will remove those properties later, they are only here to avoid breaking the test
      "transporterCompanyAddress",
      "transporterCompanyContact",
      "transporterCompanyMail",
      "transporterCompanyName",
      "transporterCompanyPhone",
      "transporterCompanySiret",
      "transporterCompanyVatNumber",
      "transporterCustomInfo",
      "transporterRecepisseDepartment",
      "transporterRecepisseIsExempted",
      "transporterRecepisseNumber",
      "transporterRecepisseValidityLimit",
      "transporterTransportMode",
      "transporterTransportPlates",
      "transporterTransportSignatureAuthor",
      "transporterTransportTakenOverAt"
    ];

    const expectedSkippedTransporter = [
      "id",
      "createdAt",
      "updatedAt",
      "bsvhuId",
      "transporterTransportPlates",
      "number",
      "transporterTransportTakenOverAt",
      "transporterTransportSignatureAuthor",
      "transporterTransportSignatureDate",
      "transporterCustomInfo"
    ];

    expect(duplicatedBsvhu.status).toEqual("INITIAL");
    expect(duplicatedBsvhu.isDraft).toBe(true);
    expect(duplicatedBsvhu.isDuplicateOf).toBe(bsvhu.id);

    expect(duplicatedBsvhu).toMatchObject({
      emitterIrregularSituation,
      emitterNoSiret,
      emitterNotOnTD,
      emitterAgrementNumber,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyStreet,
      emitterCompanyCity,
      emitterCompanyPostalCode,
      emitterCompanyCountry,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      emitterCustomInfo,
      destinationType,
      destinationPlannedOperationCode,
      destinationAgrementNumber,
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationOperationNextDestinationCompanyName,
      destinationOperationNextDestinationCompanySiret,
      destinationOperationNextDestinationCompanyAddress,
      destinationOperationNextDestinationCompanyContact,
      destinationOperationNextDestinationCompanyPhone,
      destinationOperationNextDestinationCompanyMail,
      destinationOperationNextDestinationCompanyVatNumber,
      destinationCustomInfo,
      wasteCode,
      packaging,
      identificationNumbers,
      identificationType,
      quantity,
      weightValue,
      weightIsEstimate,
      ecoOrganismeSiret,
      ecoOrganismeName,
      brokerCompanyName,
      brokerCompanySiret,
      brokerCompanyAddress,
      brokerCompanyContact,
      brokerCompanyPhone,
      brokerCompanyMail,
      brokerRecepisseNumber,
      brokerRecepisseDepartment,
      brokerRecepisseValidityLimit,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderRecepisseNumber,
      traderRecepisseDepartment,
      traderRecepisseValidityLimit,
      containsElectricOrHybridVehicles,
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

    // make sure this test breaks when a new field is added to the Bsvhu model
    // it will ensure we think of adding necessary fields to the duplicate input
    const sortFn = (a: string, b: string) => a.localeCompare(b);
    expect(Object.keys(rest).sort(sortFn)).toEqual(
      expectedSkipped.sort(sortFn)
    );

    expect(Object.keys(restTransporter).sort(sortFn)).toEqual(
      expectedSkippedTransporter.sort(sortFn)
    );

    expect(duplicatedBsvhu.intermediaries[0].siret).toEqual(intermediary.siret);

    // Vérifie que les champs signatures ne sont pas dupliqués
    expect(duplicatedBsvhu.emitterEmissionSignatureDate).toBeNull();
    expect(duplicatedBsvhu.emitterEmissionSignatureAuthor).toBeNull();
    expect(duplicatedBsvhu.destinationOperationSignatureDate).toBeNull();
    expect(duplicatedBsvhu.destinationOperationSignatureAuthor).toBeNull();
    expect(duplicatedBsvhu.transporterTransportSignatureDate).toBeNull();
    expect(duplicatedBsvhu.destinationReceptionSignatureAuthor).toBeNull();
    expect(duplicatedBsvhu.destinationReceptionSignatureDate).toBeNull();
    expect(duplicatedBsvhu.destinationReceptionDate).toBeNull();
    expect(duplicatedBsvhu.transportersOrgIds).toEqual([
      transporterCompanySiret
    ]);
    expect(duplicatedTransporter.transporterTransportSignatureDate).toBeNull();
    expect(
      duplicatedTransporter.transporterTransportSignatureAuthor
    ).toBeNull();
  });

  it("should duplicate without the transporter receipt when it was emptied", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });
    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: {
          id: bsvhu.id
        }
      }
    );
    const duplicateBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: data.duplicateBsvhu.id },
      include: { transporters: true }
    });
    expect(
      duplicateBsvhu?.transporters[0].transporterRecepisseDepartment
    ).toBeNull();
    expect(
      duplicateBsvhu?.transporters[0].transporterRecepisseValidityLimit
    ).toBeNull();
    expect(
      duplicateBsvhu?.transporters[0].transporterRecepisseNumber
    ).toBeNull();
  });

  it("should duplicate transporter receipt when it was emptied info", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const receipt = await transporterReceiptFactory({ company });
    const bsvhu = await bsvhuFactory({
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });
    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: {
          id: bsvhu.id
        }
      }
    );
    const duplicateBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: data.duplicateBsvhu.id },
      include: { transporters: true }
    });
    expect(duplicateBsvhu?.transporters[0].transporterRecepisseDepartment).toBe(
      receipt.department
    );
    expect(
      duplicateBsvhu?.transporters[0].transporterRecepisseValidityLimit?.toISOString()
    ).toBe(receipt.validityLimit.toISOString());
    expect(duplicateBsvhu?.transporters[0].transporterRecepisseNumber).toBe(
      receipt.receiptNumber
    );
  });

  test("duplicated BSVHU should have the updated data when company info changes", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory({
      transporterReceipt: {
        create: {
          receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
          validityLimit: TODAY.toISOString(),
          department: "TRANSPORTER- RECEIPT-DEPARTMENT"
        }
      }
    });
    const transporterReceipt =
      await prisma.transporterReceipt.findUniqueOrThrow({
        where: { id: transporterCompany.transporterReceiptId! }
      });
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"],
      vhuAgrementDemolisseur: {
        create: {
          agrementNumber: "UPDATED-AGREEMENT-NUMBER",
          department: "UPDATED-DEPARTMENT"
        }
      }
    });
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        emitterCompanyContact: emitter.company.contact,
        emitterCompanyMail: emitter.company.contactEmail,
        emitterCompanyPhone: emitter.company.contactPhone,
        destinationCompanySiret: destinationCompany.siret,
        destinationCompanyName: destinationCompany.name,
        destinationCompanyAddress: destinationCompany.address,
        destinationCompanyContact: destinationCompany.contact,
        destinationCompanyMail: destinationCompany.contactEmail,
        destinationCompanyPhone: destinationCompany.contactPhone,
        transporters: {
          create: {
            transporterCompanySiret: transporterCompany.siret,
            transporterCompanyName: transporterCompany.name,
            transporterCompanyAddress: transporterCompany.address,
            transporterCompanyContact: transporterCompany.contact,
            transporterCompanyMail: transporterCompany.contactEmail,
            transporterCompanyPhone: transporterCompany.contactPhone,
            transporterRecepisseNumber: transporterReceipt.receiptNumber,
            transporterRecepisseDepartment: transporterReceipt.department,
            transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    await prisma.company.update({
      where: { id: emitter.company.id },
      data: {
        name: "UPDATED-EMITTER-NAME",
        address: "UPDATED-EMITTER-ADDRESS",
        contact: "UPDATED-EMITTER-CONTACT",
        contactPhone: "UPDATED-EMITTER-PHONE",
        contactEmail: "UPDATED-EMITTER-MAIL"
      }
    });

    await prisma.company.update({
      where: { id: transporterCompany.id },
      data: {
        name: "UPDATED-TRANSPORTER-NAME",
        address: "UPDATED-TRANSPORTER-ADDRESS",
        contact: "UPDATED-TRANSPORTER-CONTACT",
        contactPhone: "UPDATED-TRANSPORTER-PHONE",
        contactEmail: "UPDATED-TRANSPORTER-MAIL"
      }
    });

    await prisma.transporterReceipt.update({
      where: { id: transporterCompany.transporterReceiptId! },
      data: {
        receiptNumber: "UPDATED-TRANSPORTER-RECEIPT-NUMBER",
        validityLimit: FOUR_DAYS_AGO.toISOString(),
        department: "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
      }
    });

    await prisma.company.update({
      where: { id: destinationCompany.id },
      data: {
        name: "UPDATED-DESTINATION-NAME",
        address: "UPDATED-DESTINATION-ADDRESS",
        contact: "UPDATED-DESTINATION-CONTACT",
        contactPhone: "UPDATED-DESTINATION-PHONE",
        contactEmail: "UPDATED-DESTINATION-MAIL"
      }
    });

    // SIRENE info should take over internal data so we test that too
    function searchResult(companyName: string) {
      return {
        name: `updated ${companyName} name`,
        address: `updated ${companyName} address`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("emitter"),
      [transporterCompany.siret!]: searchResult("transporter"),
      [destinationCompany.siret!]: searchResult("destination")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: {
          id: bsvhu.id
        }
      }
    );

    const duplicatedBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: data.duplicateBsvhu.id },
      include: { transporters: true }
    });
    // SIRENE info takes over
    expect(duplicatedBsvhu.emitterCompanyName).toEqual("updated emitter name");
    expect(duplicatedBsvhu.emitterCompanyAddress).toEqual(
      "updated emitter address"
    );
    // internal info
    expect(duplicatedBsvhu.emitterCompanyContact).toEqual(
      "UPDATED-EMITTER-CONTACT"
    );
    expect(duplicatedBsvhu.emitterCompanyMail).toEqual("UPDATED-EMITTER-MAIL");
    expect(duplicatedBsvhu.emitterCompanyPhone).toEqual(
      "UPDATED-EMITTER-PHONE"
    );

    // SIRENE info takes over
    expect(duplicatedBsvhu.transporters[0].transporterCompanyName).toEqual(
      "updated transporter name"
    );
    expect(duplicatedBsvhu.transporters[0].transporterCompanyAddress).toEqual(
      "updated transporter address"
    );
    // internal info
    expect(duplicatedBsvhu.transporters[0].transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(duplicatedBsvhu.transporters[0].transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(duplicatedBsvhu.transporters[0].transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );

    expect(duplicatedBsvhu.transporters[0].transporterRecepisseNumber).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-NUMBER"
    );
    expect(
      duplicatedBsvhu.transporters[0].transporterRecepisseValidityLimit
    ).toEqual(FOUR_DAYS_AGO);
    expect(
      duplicatedBsvhu.transporters[0].transporterRecepisseDepartment
    ).toEqual("UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT");
    // SIRENE info takes over
    expect(duplicatedBsvhu.destinationCompanyName).toEqual(
      "updated destination name"
    );
    expect(duplicatedBsvhu.destinationCompanyAddress).toEqual(
      "updated destination address"
    );
    // internal info
    expect(duplicatedBsvhu.destinationCompanyContact).toEqual(
      "UPDATED-DESTINATION-CONTACT"
    );
    expect(duplicatedBsvhu.destinationCompanyMail).toEqual(
      "UPDATED-DESTINATION-MAIL"
    );
    expect(duplicatedBsvhu.destinationCompanyPhone).toEqual(
      "UPDATED-DESTINATION-PHONE"
    );
  });

  test("duplicated BSVHU should have the updated SIRENE data when company info changes", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory({
      transporterReceipt: {
        create: {
          receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
          validityLimit: TODAY.toISOString(),
          department: "TRANSPORTER- RECEIPT-DEPARTMENT"
        }
      }
    });
    const transporterReceipt =
      await prisma.transporterReceipt.findUniqueOrThrow({
        where: { id: transporterCompany.transporterReceiptId! }
      });
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"],
      vhuAgrementDemolisseur: {
        create: {
          agrementNumber: "UPDATED-AGREEMENT-NUMBER",
          department: "UPDATED-DEPARTMENT"
        }
      }
    });

    const intermediary1 = await userWithCompanyFactory("MEMBER");
    const intermediary2 = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        emitterCompanyContact: emitter.company.contact,
        emitterCompanyMail: emitter.company.contactEmail,
        emitterCompanyPhone: emitter.company.contactPhone,
        transporters: {
          create: {
            transporterCompanySiret: transporterCompany.siret,
            transporterCompanyName: transporterCompany.name,
            transporterCompanyAddress: transporterCompany.address,
            transporterCompanyContact: transporterCompany.contact,
            transporterCompanyMail: transporterCompany.contactEmail,
            transporterCompanyPhone: transporterCompany.contactPhone,
            transporterRecepisseNumber: transporterReceipt.receiptNumber,
            transporterRecepisseDepartment: transporterReceipt.department,
            transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
            number: 1
          }
        },
        destinationCompanySiret: destinationCompany.siret,
        destinationCompanyName: destinationCompany.name,
        destinationCompanyAddress: destinationCompany.address,
        destinationCompanyContact: destinationCompany.contact,
        destinationCompanyMail: destinationCompany.contactEmail,
        destinationCompanyPhone: destinationCompany.contactPhone,
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
      }
    });

    const { mutate } = makeClient(emitter.user);

    function searchResult(companyName: string) {
      return {
        name: `updated ${companyName} name`,
        address: `updated ${companyName} address`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("emitter"),
      [transporterCompany.siret!]: searchResult("transporter"),
      [destinationCompany.siret!]: searchResult("destination"),
      [intermediary1.company.siret!]: searchResult("intermediary1"),
      [intermediary2.company.siret!]: searchResult("intermediary2")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: {
          id: bsvhu.id
        }
      }
    );

    const duplicatedBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: data.duplicateBsvhu.id },
      include: {
        intermediaries: true,
        transporters: true
      }
    });

    // Emitter
    expect(duplicatedBsvhu.emitterCompanyName).toEqual("updated emitter name");
    expect(duplicatedBsvhu.emitterCompanyAddress).toEqual(
      "updated emitter address"
    );

    // Transporter
    expect(duplicatedBsvhu.transporters[0].transporterCompanyName).toEqual(
      "updated transporter name"
    );
    expect(duplicatedBsvhu.transporters[0].transporterCompanyAddress).toEqual(
      "updated transporter address"
    );

    // Destination
    expect(duplicatedBsvhu.destinationCompanyName).toEqual(
      "updated destination name"
    );
    expect(duplicatedBsvhu.destinationCompanyAddress).toEqual(
      "updated destination address"
    );
    // Intermediaries
    expect(duplicatedBsvhu.intermediaries[0].name).toEqual(
      "updated intermediary1 name"
    );
    expect(duplicatedBsvhu.intermediaries[0].address).toEqual(
      "updated intermediary1 address"
    );
    expect(duplicatedBsvhu.intermediaries[1].name).toEqual(
      "updated intermediary2 name"
    );
    expect(duplicatedBsvhu.intermediaries[1].address).toEqual(
      "updated intermediary2 address"
    );
  });

  it("should *not* duplicate destinationOperationCode & Mode", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        destinationOperationCode: "R1",
        destinationOperationMode: "VALORISATION_ENERGETIQUE"
      }
    });
    const { mutate } = makeClient(emitter.user);

    // When
    const { data, errors } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: { id: bsvhu.id }
      }
    );
    expect(errors).toBeUndefined();

    // Then
    const duplicatedVhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: data.duplicateBsvhu.id }
    });

    expect(duplicatedVhu.destinationOperationCode).toBeNull();
    expect(duplicatedVhu.destinationOperationMode).toBeNull();
  });

  it("should replace deprecated identification type", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        createdAt: new Date("2024-10-01T00:00:00.000Z"),
        packaging: "LOT",
        identificationType: "NUMERO_ORDRE_LOTS_SORTANTS"
      }
    });
    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: { id: bsvhu.id }
      }
    );

    const duplicatedVhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: data.duplicateBsvhu.id }
    });

    expect(duplicatedVhu.packaging).toEqual("UNITE");
    expect(duplicatedVhu.identificationType).toEqual("NUMERO_IMMATRICULATION");
  });

  it("should set identification type to null when packaging is LOT", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        createdAt: new Date("2024-10-01T00:00:00.000Z"),
        packaging: "LOT",
        identificationType: "NUMERO_ORDRE_REGISTRE_POLICE" // LOT with non null identificationType are now invalid
      }
    });
    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: { id: bsvhu.id }
      }
    );

    const duplicatedVhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: data.duplicateBsvhu.id }
    });

    expect(duplicatedVhu.packaging).toEqual("LOT");
    expect(duplicatedVhu.identificationType).toBeNull();
  });

  it("should set identification type to non null when packaging is UNITE", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        createdAt: new Date("2024-10-01T00:00:00.000Z"),
        packaging: "UNITE",
        identificationType: null // UNITE with null identificationType are now invalid
      }
    });
    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: { id: bsvhu.id }
      }
    );

    const duplicatedVhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: data.duplicateBsvhu.id }
    });

    expect(duplicatedVhu.packaging).toEqual("UNITE");
    expect(duplicatedVhu.identificationType).toEqual("NUMERO_IMMATRICULATION");
  });

  it("should preserve identification type and packaging when valid", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        createdAt: new Date("2024-10-01T00:00:00.000Z"),
        packaging: "UNITE",
        identificationType: "NUMERO_IMMATRICULATION"
      }
    });
    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: { id: bsvhu.id }
      }
    );

    const duplicatedVhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: data.duplicateBsvhu.id }
    });

    expect(duplicatedVhu.packaging).toEqual("UNITE");
    expect(duplicatedVhu.identificationType).toEqual("NUMERO_IMMATRICULATION");
  });
});
