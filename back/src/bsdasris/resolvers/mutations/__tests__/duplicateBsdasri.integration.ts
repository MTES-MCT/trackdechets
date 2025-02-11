import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import type { CompanySearchResult, Mutation } from "@td/codegen-back";
import { BsdasriType } from "@prisma/client";
import { prisma } from "@td/prisma";
import { xDaysAgo } from "../../../../utils";
import { searchCompany } from "../../../../companies/search";

jest.mock("../../../../companies/search");

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

const DUPLICATE_DASRI = `
mutation DuplicateDasri($id: ID!){
  duplicateBsdasri(id: $id)  {
    id
    status
    isDraft
    isDuplicateOf
  }
}
`;
describe("Mutation.duplicateBsdasri", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
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
  it("should disallow users not belonging to the duplicated dasri", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { company: otherCompany } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(otherCompany)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
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

  it.each([BsdasriType.GROUPING, BsdasriType.SYNTHESIS])(
    "should disallow %p  bsdasri duplication",
    async dasriType => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(company),
          type: dasriType
        }
      });

      const { mutate } = makeClient(user); // emitter

      const { errors } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
        DUPLICATE_DASRI,
        {
          variables: {
            id: dasri.id
          }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Les dasris de synthèse ou de groupement ne sont pas duplicables",
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    }
  );

  it("should duplicate a  dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );

    expect(data.duplicateBsdasri.status).toBe("INITIAL");
    expect(data.duplicateBsdasri.isDraft).toBe(true);
    expect(data.duplicateBsdasri.isDuplicateOf).toBe(dasri.id);
  });

  test("duplicated BSDASRI should have the updated data when company info changes", async () => {
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
    const bsdasri = await bsdasriFactory({
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

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: bsdasri.id
        }
      }
    );

    const duplicatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.duplicateBsdasri.id }
    });

    expect(duplicatedBsdasri.emitterCompanyName).toEqual(
      "UPDATED-EMITTER-NAME"
    );
    expect(duplicatedBsdasri.emitterCompanyAddress).toEqual(
      "UPDATED-EMITTER-ADDRESS"
    );
    expect(duplicatedBsdasri.emitterCompanyContact).toEqual(
      "UPDATED-EMITTER-CONTACT"
    );
    expect(duplicatedBsdasri.emitterCompanyMail).toEqual(
      "UPDATED-EMITTER-MAIL"
    );
    expect(duplicatedBsdasri.emitterCompanyPhone).toEqual(
      "UPDATED-EMITTER-PHONE"
    );

    expect(duplicatedBsdasri.transporterCompanyName).toEqual(
      "UPDATED-TRANSPORTER-NAME"
    );
    expect(duplicatedBsdasri.transporterCompanyAddress).toEqual(
      "UPDATED-TRANSPORTER-ADDRESS"
    );
    expect(duplicatedBsdasri.transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(duplicatedBsdasri.transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(duplicatedBsdasri.transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );

    expect(duplicatedBsdasri.transporterRecepisseNumber).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-NUMBER"
    );
    expect(duplicatedBsdasri.transporterRecepisseValidityLimit).toEqual(
      FOUR_DAYS_AGO
    );
    expect(duplicatedBsdasri.transporterRecepisseDepartment).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
    );

    expect(duplicatedBsdasri.destinationCompanyName).toEqual(
      "UPDATED-DESTINATION-NAME"
    );
    expect(duplicatedBsdasri.destinationCompanyAddress).toEqual(
      "UPDATED-DESTINATION-ADDRESS"
    );
    expect(duplicatedBsdasri.destinationCompanyContact).toEqual(
      "UPDATED-DESTINATION-CONTACT"
    );
    expect(duplicatedBsdasri.destinationCompanyMail).toEqual(
      "UPDATED-DESTINATION-MAIL"
    );
    expect(duplicatedBsdasri.destinationCompanyPhone).toEqual(
      "UPDATED-DESTINATION-PHONE"
    );
    // Test emptying Transporter receipt
    await prisma.transporterReceipt.delete({
      where: { id: transporterCompany.transporterReceiptId! }
    });
    const { data: data2 } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: bsdasri.id
        }
      }
    );

    const duplicatedBsdasri2 = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data2.duplicateBsdasri.id }
    });

    expect(duplicatedBsdasri2.transporterRecepisseNumber).toBeNull();
    expect(duplicatedBsdasri2.transporterRecepisseValidityLimit).toBeNull();
    expect(duplicatedBsdasri2.transporterRecepisseDepartment).toBeNull();
  });

  test("duplicated BSDASRI should have the updated SIRENE data when company info changes", async () => {
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
    const bsdasri = await bsdasriFactory({
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

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: bsdasri.id
        }
      }
    );

    const duplicatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.duplicateBsdasri.id }
    });

    // Emitter
    expect(duplicatedBsdasri.emitterCompanyName).toEqual(
      "updated emitter name"
    );
    expect(duplicatedBsdasri.emitterCompanyAddress).toEqual(
      "updated emitter address"
    );

    // Transporter
    expect(duplicatedBsdasri.transporterCompanyName).toEqual(
      "updated transporter name"
    );
    expect(duplicatedBsdasri.transporterCompanyAddress).toEqual(
      "updated transporter address"
    );

    // Destination
    expect(duplicatedBsdasri.destinationCompanyName).toEqual(
      "updated destination name"
    );
    expect(duplicatedBsdasri.destinationCompanyAddress).toEqual(
      "updated destination address"
    );
  });

  it("should *not* duplicate waste details", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );
    expect(data.duplicateBsdasri.status).toBe("INITIAL");
    expect(data.duplicateBsdasri.isDraft).toBe(true);

    const duplicatedDasri = await prisma.bsdasri.findFirstOrThrow({
      where: { id: data.duplicateBsdasri.id }
    });

    expect(duplicatedDasri.emitterWasteWeightValue).toBeNull();
    expect(duplicatedDasri.emitterWasteWeightIsEstimate).toBeNull();
    expect(duplicatedDasri.emitterWasteVolume).toBeNull();
    expect(duplicatedDasri.emitterWastePackagings).toStrictEqual([]);
  });

  it("should *not* duplicate destinationOperationCode & Mode", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        destinationOperationCode: "R1",
        destinationOperationMode: "VALORISATION_ENERGETIQUE"
      }
    });

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );
    expect(errors).toBeUndefined();

    // When
    const duplicatedDasri = await prisma.bsdasri.findFirstOrThrow({
      where: { id: data.duplicateBsdasri.id }
    });

    expect(duplicatedDasri.destinationOperationCode).toBeNull();
    expect(duplicatedDasri.destinationOperationMode).toBeNull();
  });

  it("should *not* duplicate transporter plates", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        transporterTransportPlates: ["AZ-12-RT"]
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "duplicateBsdasri">>(
      DUPLICATE_DASRI,
      {
        variables: {
          id: dasri.id
        }
      }
    );
    expect(data.duplicateBsdasri.status).toBe("INITIAL");
    expect(data.duplicateBsdasri.isDraft).toBe(true);

    const duplicatedDasri = await prisma.bsdasri.findFirstOrThrow({
      where: { id: data.duplicateBsdasri.id }
    });

    expect(duplicatedDasri.transporterTransportPlates).toStrictEqual([]);
  });
});
