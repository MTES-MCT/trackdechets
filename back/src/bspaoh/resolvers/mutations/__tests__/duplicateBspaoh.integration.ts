import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bspaohFactory } from "../../../__tests__/factories";
import prisma from "../../../../prisma";
import { xDaysAgo } from "../../../../utils";
import {
  CompanySearchResult,
  Mutation
} from "../../../../generated/graphql/types";
import { searchCompany } from "../../../../companies/search";

jest.mock("../../../../companies/search");

const DUPLICATE_BSPAOH = `
mutation DuplicateBspaoh($id: ID!){
  duplicateBspaoh(id: $id)  {
    id
    status
    isDraft
  }
}
`;

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

describe("Mutation.duplicateBspaoh", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<Pick<Mutation, "duplicateBspaoh">>(
      DUPLICATE_BSPAOH,
      {
        variables: {
          id: bspaoh.id
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

  it("should disallow users not belonging to the duplicated bspaoh", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { company: otherCompany } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "duplicateBspaoh">>(
      DUPLICATE_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas dupliquer un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should duplicate a bspaoh", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "duplicateBspaoh">>(
      DUPLICATE_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    expect(data.duplicateBspaoh.status).toBe("INITIAL");
    expect(data.duplicateBspaoh.isDraft).toBe(true);

    const duplicated = await prisma.bspaoh.findUnique({
      where: { id: bspaoh.id },
      include: { transporters: true }
    });

    expect(duplicated?.transporters[0]?.transporterCompanySiret).toEqual(
      bspaoh.transporters[0]?.transporterCompanySiret
    );
  });

  test("duplicated BSPAOH should have the updated data when company info changes", async () => {
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
    const destinationCompany = await companyFactory();
    const bspaoh = await bspaohFactory({
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
            number: 1,
            transporterCompanySiret: transporterCompany.siret,
            transporterCompanyName: transporterCompany.name,
            transporterCompanyAddress: transporterCompany.address,
            transporterCompanyContact: transporterCompany.contact,
            transporterCompanyMail: transporterCompany.contactEmail,
            transporterCompanyPhone: transporterCompany.contactPhone,
            transporterRecepisseNumber: transporterReceipt.receiptNumber,
            transporterRecepisseDepartment: transporterReceipt.department,
            transporterRecepisseValidityLimit: transporterReceipt.validityLimit
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

    const { data } = await mutate<Pick<Mutation, "duplicateBspaoh">>(
      DUPLICATE_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    const duplicatedBspaoh = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: data.duplicateBspaoh.id },
      include: { transporters: true }
    });
    const transporter = duplicatedBspaoh.transporters[0];

    expect(duplicatedBspaoh.emitterCompanyName).toEqual("UPDATED-EMITTER-NAME");
    expect(duplicatedBspaoh.emitterCompanyAddress).toEqual(
      "UPDATED-EMITTER-ADDRESS"
    );
    expect(duplicatedBspaoh.emitterCompanyContact).toEqual(
      "UPDATED-EMITTER-CONTACT"
    );
    expect(duplicatedBspaoh.emitterCompanyMail).toEqual("UPDATED-EMITTER-MAIL");
    expect(duplicatedBspaoh.emitterCompanyPhone).toEqual(
      "UPDATED-EMITTER-PHONE"
    );

    expect(transporter.transporterCompanyName).toEqual(
      "UPDATED-TRANSPORTER-NAME"
    );
    expect(transporter.transporterCompanyAddress).toEqual(
      "UPDATED-TRANSPORTER-ADDRESS"
    );
    expect(transporter.transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(transporter.transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(transporter.transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );

    expect(transporter.transporterRecepisseNumber).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-NUMBER"
    );
    expect(transporter.transporterRecepisseValidityLimit).toEqual(
      FOUR_DAYS_AGO
    );
    expect(transporter.transporterRecepisseDepartment).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
    );

    expect(duplicatedBspaoh.destinationCompanyName).toEqual(
      "UPDATED-DESTINATION-NAME"
    );
    expect(duplicatedBspaoh.destinationCompanyAddress).toEqual(
      "UPDATED-DESTINATION-ADDRESS"
    );
    expect(duplicatedBspaoh.destinationCompanyContact).toEqual(
      "UPDATED-DESTINATION-CONTACT"
    );
    expect(duplicatedBspaoh.destinationCompanyMail).toEqual(
      "UPDATED-DESTINATION-MAIL"
    );
    expect(duplicatedBspaoh.destinationCompanyPhone).toEqual(
      "UPDATED-DESTINATION-PHONE"
    );
    // Test emptying Transporter receipt
    await prisma.transporterReceipt.delete({
      where: { id: transporterCompany.transporterReceiptId! }
    });
    const { data: data2 } = await mutate<Pick<Mutation, "duplicateBspaoh">>(
      DUPLICATE_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    const duplicatedBspaoh2 = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: data2.duplicateBspaoh.id },
      include: { transporters: true }
    });
    const transporter2 = duplicatedBspaoh2.transporters[0];
    expect(transporter2.transporterRecepisseNumber).toBeNull();
    expect(transporter2.transporterRecepisseValidityLimit).toBeNull();
    expect(transporter2.transporterRecepisseDepartment).toBeNull();
  });

  test("duplicated BSPAOH should have the sirenified data when company info changes", async () => {
    // Given
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
    const destinationCompany = await companyFactory();

    const bspaoh = await bspaohFactory({
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
            number: 1,
            transporterCompanySiret: transporterCompany.siret,
            transporterCompanyName: transporterCompany.name,
            transporterCompanyAddress: transporterCompany.address,
            transporterCompanyContact: transporterCompany.contact,
            transporterCompanyMail: transporterCompany.contactEmail,
            transporterCompanyPhone: transporterCompany.contactPhone,
            transporterRecepisseNumber: transporterReceipt.receiptNumber,
            transporterRecepisseDepartment: transporterReceipt.department,
            transporterRecepisseValidityLimit: transporterReceipt.validityLimit
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
      [transporterCompany.siret!]: searchResult("transporter"),
      [destinationCompany.siret!]: searchResult("destination")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const { mutate } = makeClient(emitter.user);

    const { errors, data } = await mutate<Pick<Mutation, "duplicateBspaoh">>(
      DUPLICATE_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const duplicatedBspaoh = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: data.duplicateBspaoh.id },
      include: { transporters: true }
    });

    // Check emitter info is updated
    expect(duplicatedBspaoh.emitterCompanyName).toEqual("updated emitter name");
    expect(duplicatedBspaoh.emitterCompanyAddress).toEqual(
      "updated emitter address"
    );

    // Check destination info is updated
    expect(duplicatedBspaoh.destinationCompanyName).toEqual(
      "updated destination name"
    );
    expect(duplicatedBspaoh.destinationCompanyAddress).toEqual(
      "updated destination address"
    );

    const duplicatedBspaohTransporter = duplicatedBspaoh.transporters[0];
    //  Check transporter info is updated
    expect(duplicatedBspaohTransporter.transporterCompanyName).toEqual(
      "updated transporter name"
    );
    expect(duplicatedBspaohTransporter.transporterCompanyAddress).toEqual(
      "updated transporter address"
    );
  });
});
