import { userFactory, companyFactory } from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import * as mailsHelper from "../../../common/mails.helper";
import { prisma, MutationType } from "../../../generated/prisma-client";
import makeClient from "../../../__tests__/testClient";
import { ErrorCode } from "../../../common/errors";
import { CompanyType } from "../../../generated/types";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("Create company endpoint", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  test("should create company and userAssociation", async () => {
    const user = await userFactory();

    const siret = "12345678912345";
    const gerepId = "1234";
    const name = "Acme";
    const companyTypes = [CompanyType.Producer];

    const mutation = `
    mutation {
      createCompany(
        companyInput: {
          siret: "${siret}"
          gerepId: "${gerepId}"
          companyName: "${name}"
          companyTypes: [${companyTypes}]
        }
      ) { siret, gerepId, name, companyTypes }
    }
  `;

    const { mutate } = makeClient(user);

    const { data } = await mutate(mutation);

    const expected = {
      siret,
      gerepId,
      name,
      companyTypes
    };
    expect(data.createCompany).toEqual(expected);

    const newCompanyExists = await prisma.$exists.company({ siret });
    expect(newCompanyExists).toBe(true);

    const newCompanyAssociationExists = await prisma.$exists.companyAssociation(
      { company: { siret }, user: { id: user.id } }
    );
    expect(newCompanyAssociationExists).toBe(true);
  });

  test("should link to a transporterReceipt", async () => {
    const user = await userFactory();

    const siret = "12345678912345";
    const name = "Acme";
    const companyTypes = [CompanyType.Transporter];
    const transporterReceipt = {
      receiptNumber: "1234",
      validityLimit: "2023-03-31T00:00:00.000Z",
      department: "07"
    };

    const receiptId = await prisma
      .createTransporterReceipt(transporterReceipt)
      .id();

    const mutation = `
      mutation {
        createCompany(
          companyInput: {
            siret: "${siret}"
            companyName: "${name}"
            companyTypes: [${companyTypes}]
            transporterReceiptId: "${receiptId}"
          }
        ) {
            siret
            transporterReceipt {
              receiptNumber
              validityLimit
              department
            }
          }
      }`;

    const { mutate } = makeClient(user);

    const { data } = await mutate(mutation);

    expect(data.createCompany.transporterReceipt).toEqual(transporterReceipt);
  });

  test("should link to a traderReceipt", async () => {
    const user = await userFactory();

    const siret = "12345678912345";
    const name = "Acme";
    const companyTypes = [CompanyType.Trader];
    const traderReceipt = {
      receiptNumber: "1234",
      validityLimit: "2023-03-31T00:00:00.000Z",
      department: "07"
    };

    const receiptId = await prisma.createTraderReceipt(traderReceipt).id();

    const mutation = `
      mutation {
        createCompany(
          companyInput: {
            siret: "${siret}"
            companyName: "${name}"
            companyTypes: [${companyTypes}]
            traderReceiptId: "${receiptId}"
          }
        ) {
            siret
            traderReceipt {
              receiptNumber
              validityLimit
              department
            }
          }
      }`;

    const { mutate } = makeClient(user);

    const { data } = await mutate(mutation);

    // check the traderReceipt was created in db
    expect(data.createCompany.traderReceipt).toEqual(traderReceipt);
  });

  it("should create document keys", async () => {
    const user = await userFactory();

    const siret = "12345678912345";
    const name = "Acme";
    const companyTypes = [CompanyType.Producer];

    const mutation = `
      mutation {
        createCompany(
          companyInput: {
            siret: "${siret}"
            companyName: "${name}"
            companyTypes: [${companyTypes}]
            documentKeys: ["key1", "key2"]
          }
        ) {
            siret
          }
      }`;

    const { mutate } = makeClient(user);

    await mutate(mutation);

    const company = await prisma.company({ siret });
    expect(company.documentKeys).toEqual(["key1", "key2"]);
  });

  test("should throw error if the company already exist", async () => {
    const user = await userFactory();

    const company = await companyFactory();

    // try re-creating the same company
    const mutation = `
    mutation {
      createCompany(
        companyInput: {
          siret: "${company.siret}"
          gerepId: "${company.gerepId}"
          companyName: "${company.name}"
          companyTypes: [${company.companyTypes}]
        }
        ) { siret, gerepId, name, companyTypes }
      }
      `;
    const { mutate } = makeClient(user);

    const { errors, data } = await mutate(mutation);

    expect(data.createCompany).toBeNull();
    expect(errors[0].extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
  });

  test("should alert when a user creates too many companies", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);

    async function createCompany(siret) {
      const mutation = `
        mutation {
          createCompany(
            companyInput: {
              siret: "${siret}"
              gerepId: "1234"
            }
          ) { id }
        }
      `;
      await mutate(mutation);
    }

    // 1 company
    await createCompany("12345678912345");
    expect(sendMailSpy).not.toBeCalled();

    // 2 companies
    await createCompany("23456789123456");
    expect(sendMailSpy).not.toBeCalled();

    // 3 companies
    await createCompany("34567891234567");
    expect(sendMailSpy).not.toBeCalled();

    // 4 companies
    await createCompany("45678912345678");
    expect(sendMailSpy).not.toBeCalled();

    // 5 companies
    await createCompany("56789123456789");
    expect(sendMailSpy).not.toBeCalled();

    // 6 companies => should warn
    await createCompany("67891234567890");
    expect(sendMailSpy).toBeCalled();
  });
});
