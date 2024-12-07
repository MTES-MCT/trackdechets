import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  CompanySearchResult,
  Mutation,
  MutationDuplicateBsffArgs
} from "@td/codegen-back";
import {
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  createBsff,
  createBsffAfterOperation
} from "../../../__tests__/factories";
import { xDaysAgo } from "../../../../utils";
import { prisma } from "@td/prisma";
import { searchCompany } from "../../../../companies/search";
import { getFirstTransporterSync } from "../../../database";

jest.mock("../../../../companies/search");

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

const DUPLICATE_BSFF = gql`
  mutation DuplicateBsff($id: ID!) {
    duplicateBsff(id: $id) {
      id
      status
    }
  }
`;

describe("Mutation.duplicateBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to duplicate a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsff({ emitter });
    const { data } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.duplicateBsff.status).toEqual("INITIAL");
  });

  it("should disallow unauthenticated user from duplicating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: "123"
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: expect.objectContaining({
          code: "UNAUTHENTICATED"
        })
      })
    ]);
  });

  it("should disallow user that is not a contributor on the bsff", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const bsff = await createBsff();
    const { errors } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas dupliquer un bordereau sur lequel votre entreprise n'apparait pas"
      })
    ]);
  });

  it("should throw an error if the bsff being duplicated doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: "123"
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le BSFF n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error if the bsff being duplicated has been deleted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsff({ emitter }, { data: { isDeleted: true } });
    const { errors } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le BSFF n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  test("duplicated BSFF should have the updated data when company info changes", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");

    const transporter = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: {
        create: {
          receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
          validityLimit: TODAY.toISOString(),
          department: "TRANSPORTER- RECEIPT-DEPARTMENT"
        }
      }
    });

    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter, transporter, destination });
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
      where: { id: transporter.company.id },
      data: {
        name: "UPDATED-TRANSPORTER-NAME",
        address: "UPDATED-TRANSPORTER-ADDRESS",
        contact: "UPDATED-TRANSPORTER-CONTACT",
        contactPhone: "UPDATED-TRANSPORTER-PHONE",
        contactEmail: "UPDATED-TRANSPORTER-MAIL"
      }
    });

    await prisma.transporterReceipt.update({
      where: { id: transporter.company.transporterReceiptId! },
      data: {
        receiptNumber: "UPDATED-TRANSPORTER-RECEIPT-NUMBER",
        validityLimit: FOUR_DAYS_AGO.toISOString(),
        department: "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
      }
    });

    await prisma.company.update({
      where: { id: destination.company.id },
      data: {
        name: "UPDATED-DESTINATION-NAME",
        address: "UPDATED-DESTINATION-ADDRESS",
        contact: "UPDATED-DESTINATION-CONTACT",
        contactPhone: "UPDATED-DESTINATION-PHONE",
        contactEmail: "UPDATED-DESTINATION-MAIL"
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    const duplicatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: data.duplicateBsff.id },
      include: { transporters: true }
    });

    const bsffTransporter = getFirstTransporterSync(duplicatedBsff)!;

    expect(duplicatedBsff.emitterCompanyName).toEqual("UPDATED-EMITTER-NAME");
    expect(duplicatedBsff.emitterCompanyAddress).toEqual(
      "UPDATED-EMITTER-ADDRESS"
    );
    expect(duplicatedBsff.emitterCompanyContact).toEqual(
      "UPDATED-EMITTER-CONTACT"
    );
    expect(duplicatedBsff.emitterCompanyMail).toEqual("UPDATED-EMITTER-MAIL");
    expect(duplicatedBsff.emitterCompanyPhone).toEqual("UPDATED-EMITTER-PHONE");

    expect(bsffTransporter.transporterCompanyName).toEqual(
      "UPDATED-TRANSPORTER-NAME"
    );
    expect(bsffTransporter.transporterCompanyAddress).toEqual(
      "UPDATED-TRANSPORTER-ADDRESS"
    );
    expect(bsffTransporter.transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(bsffTransporter.transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(bsffTransporter.transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );

    expect(bsffTransporter.transporterRecepisseNumber).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-NUMBER"
    );
    expect(bsffTransporter.transporterRecepisseValidityLimit).toEqual(
      FOUR_DAYS_AGO
    );
    expect(bsffTransporter.transporterRecepisseDepartment).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
    );

    expect(duplicatedBsff.destinationCompanyName).toEqual(
      "UPDATED-DESTINATION-NAME"
    );
    expect(duplicatedBsff.destinationCompanyAddress).toEqual(
      "UPDATED-DESTINATION-ADDRESS"
    );
    expect(duplicatedBsff.destinationCompanyContact).toEqual(
      "UPDATED-DESTINATION-CONTACT"
    );
    expect(duplicatedBsff.destinationCompanyMail).toEqual(
      "UPDATED-DESTINATION-MAIL"
    );
    expect(duplicatedBsff.destinationCompanyPhone).toEqual(
      "UPDATED-DESTINATION-PHONE"
    );
    // Test emptying Transporter receipt
    await prisma.transporterReceipt.delete({
      where: { id: transporter.company.transporterReceiptId! }
    });
    const { data: data2 } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    const duplicatedBsff2 = await prisma.bsff.findUniqueOrThrow({
      where: { id: data2.duplicateBsff.id },
      include: { transporters: true }
    });

    const bsffTransporter2 = getFirstTransporterSync(duplicatedBsff2)!;

    expect(bsffTransporter2.transporterRecepisseNumber).toBeNull();
    expect(bsffTransporter2.transporterRecepisseValidityLimit).toBeNull();
    expect(bsffTransporter2.transporterRecepisseDepartment).toBeNull();
  });

  test("duplicated BSFF should have the updated SIRENE data when company info changes", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");

    const transporter = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: {
        create: {
          receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
          validityLimit: TODAY.toISOString(),
          department: "TRANSPORTER- RECEIPT-DEPARTMENT"
        }
      }
    });

    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter, transporter, destination });
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
      [transporter.company.siret!]: searchResult("transporter"),
      [destination.company.siret!]: searchResult("destination")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const { data } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    const duplicatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: data.duplicateBsff.id },
      include: { transporters: true }
    });

    const bsffTransporter = getFirstTransporterSync(duplicatedBsff)!;

    // Emitter
    expect(duplicatedBsff.emitterCompanyName).toEqual("updated emitter name");
    expect(duplicatedBsff.emitterCompanyAddress).toEqual(
      "updated emitter address"
    );

    // Transporter
    expect(bsffTransporter.transporterCompanyName).toEqual(
      "updated transporter name"
    );
    expect(bsffTransporter.transporterCompanyAddress).toEqual(
      "updated transporter address"
    );

    // Destination
    expect(duplicatedBsff.destinationCompanyName).toEqual(
      "updated destination name"
    );
    expect(duplicatedBsff.destinationCompanyAddress).toEqual(
      "updated destination address"
    );
  });

  it("should fill canAccessDraftOrgIds according to user", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await companyAssociatedToExistingUserFactory(
      emitter.user,
      UserRole.ADMIN
    );
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination: { company: destination, user: emitter.user }
      },
      {
        userId: emitter.user.id
      }
    );

    expect(bsff?.canAccessDraftOrgIds).toEqual([]);

    const { data } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    const duplicated = await prisma.bsff.findUnique({
      where: { id: data.duplicateBsff.id }
    });
    // user belongs to emitter and destination companies, their sirets are stored in canAccessDraftOrgIds
    expect(duplicated?.canAccessDraftOrgIds).toEqual([
      emitter.company.siret,
      destination.siret
    ]);
  });
});
