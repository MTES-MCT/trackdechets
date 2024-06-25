import { gql } from "graphql-tag";
import { xDaysAgo } from "../../../../utils";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  companyFactory,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsvhuFactory } from "../../../__tests__/factories.vhu";
import {
  CompanySearchResult,
  Mutation
} from "../../../../generated/graphql/types";
import { ErrorCode } from "../../../../common/errors";
import { prisma } from "@td/prisma";
import { searchCompany } from "../../../../companies/search";

jest.mock("../../../../companies/search");

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

const DUPLICATE_BVHU = gql`
  mutation DuplicateBsvhu($id: ID!) {
    duplicateBsvhu(id: $id) {
      id
      status
    }
  }
`;

describe("mutaion.duplicateBsvhu", () => {
  afterEach(resetDatabase);

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
    const bsvhu = await bsvhuFactory({
      opt: { emitterCompanySiret: emitter.company.siret }
    });
    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: { id: bsvhu.id }
      }
    );

    expect(data.duplicateBsvhu.status).toEqual("INITIAL");
  });

  it("should duplicate without the transporter receipt when it was emptied", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: { transporterCompanySiret: company.siret }
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
      where: { id: data.duplicateBsvhu.id }
    });
    expect(duplicateBsvhu?.transporterRecepisseDepartment).toBeNull();
    expect(duplicateBsvhu?.transporterRecepisseValidityLimit).toBeNull();
    expect(duplicateBsvhu?.transporterRecepisseNumber).toBeNull();
  });

  it("should duplicate transporter receipt when it was emptied info", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const receipt = await transporterReceiptFactory({ company });
    const bsvhu = await bsvhuFactory({
      opt: { transporterCompanySiret: company.siret }
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
      where: { id: data.duplicateBsvhu.id }
    });
    expect(duplicateBsvhu?.transporterRecepisseDepartment).toBe(
      receipt.department
    );
    expect(
      duplicateBsvhu?.transporterRecepisseValidityLimit?.toISOString()
    ).toBe(receipt.validityLimit.toISOString());
    expect(duplicateBsvhu?.transporterRecepisseNumber).toBe(
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
        transporterCompanySiret: transporterCompany.siret,
        transporterCompanyName: transporterCompany.name,
        transporterCompanyAddress: transporterCompany.address,
        transporterCompanyContact: transporterCompany.contact,
        transporterCompanyMail: transporterCompany.contactEmail,
        transporterCompanyPhone: transporterCompany.contactPhone,
        transporterRecepisseNumber: transporterReceipt.receiptNumber,
        transporterRecepisseDepartment: transporterReceipt.department,
        transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
        destinationCompanySiret: destinationCompany.siret,
        destinationCompanyName: destinationCompany.name,
        destinationCompanyAddress: destinationCompany.address,
        destinationCompanyContact: destinationCompany.contact,
        destinationCompanyMail: destinationCompany.contactEmail,
        destinationCompanyPhone: destinationCompany.contactPhone
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

    const { data } = await mutate<Pick<Mutation, "duplicateBsvhu">>(
      DUPLICATE_BVHU,
      {
        variables: {
          id: bsvhu.id
        }
      }
    );

    const duplicatedBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: data.duplicateBsvhu.id }
    });

    expect(duplicatedBsvhu.emitterCompanyName).toEqual("UPDATED-EMITTER-NAME");
    expect(duplicatedBsvhu.emitterCompanyAddress).toEqual(
      "UPDATED-EMITTER-ADDRESS"
    );
    expect(duplicatedBsvhu.emitterCompanyContact).toEqual(
      "UPDATED-EMITTER-CONTACT"
    );
    expect(duplicatedBsvhu.emitterCompanyMail).toEqual("UPDATED-EMITTER-MAIL");
    expect(duplicatedBsvhu.emitterCompanyPhone).toEqual(
      "UPDATED-EMITTER-PHONE"
    );

    expect(duplicatedBsvhu.transporterCompanyName).toEqual(
      "UPDATED-TRANSPORTER-NAME"
    );
    expect(duplicatedBsvhu.transporterCompanyAddress).toEqual(
      "UPDATED-TRANSPORTER-ADDRESS"
    );
    expect(duplicatedBsvhu.transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(duplicatedBsvhu.transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(duplicatedBsvhu.transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );

    expect(duplicatedBsvhu.transporterRecepisseNumber).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-NUMBER"
    );
    expect(duplicatedBsvhu.transporterRecepisseValidityLimit).toEqual(
      FOUR_DAYS_AGO
    );
    expect(duplicatedBsvhu.transporterRecepisseDepartment).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
    );

    expect(duplicatedBsvhu.destinationCompanyName).toEqual(
      "UPDATED-DESTINATION-NAME"
    );
    expect(duplicatedBsvhu.destinationCompanyAddress).toEqual(
      "UPDATED-DESTINATION-ADDRESS"
    );
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
        transporterCompanySiret: transporterCompany.siret,
        transporterCompanyName: transporterCompany.name,
        transporterCompanyAddress: transporterCompany.address,
        transporterCompanyContact: transporterCompany.contact,
        transporterCompanyMail: transporterCompany.contactEmail,
        transporterCompanyPhone: transporterCompany.contactPhone,
        transporterRecepisseNumber: transporterReceipt.receiptNumber,
        transporterRecepisseDepartment: transporterReceipt.department,
        transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
        destinationCompanySiret: destinationCompany.siret,
        destinationCompanyName: destinationCompany.name,
        destinationCompanyAddress: destinationCompany.address,
        destinationCompanyContact: destinationCompany.contact,
        destinationCompanyMail: destinationCompany.contactEmail,
        destinationCompanyPhone: destinationCompany.contactPhone
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
      where: { id: data.duplicateBsvhu.id }
    });

    // Emitter
    expect(duplicatedBsvhu.emitterCompanyName).toEqual("updated emitter name");
    expect(duplicatedBsvhu.emitterCompanyAddress).toEqual(
      "updated emitter address"
    );

    // Transporter
    expect(duplicatedBsvhu.transporterCompanyName).toEqual(
      "updated transporter name"
    );
    expect(duplicatedBsvhu.transporterCompanyAddress).toEqual(
      "updated transporter address"
    );

    // Destination
    expect(duplicatedBsvhu.destinationCompanyName).toEqual(
      "updated destination name"
    );
    expect(duplicatedBsvhu.destinationCompanyAddress).toEqual(
      "updated destination address"
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
});
