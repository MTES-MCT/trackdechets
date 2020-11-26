import { userFactory, companyFactory } from "../../../../__tests__/factories";
import { resetDatabase } from "../../../../../integration-tests/helper";
import * as mailsHelper from "../../../../mailer/mailing";
import { prisma } from "../../../../generated/prisma-client";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { AuthType } from "../../../../auth";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const CREATE_COMPANY = `
  mutation CreateCompany($companyInput: PrivateCompanyInput!) {
    createCompany(companyInput: $companyInput) {
      siret
      gerepId
      name
      companyTypes
      ecoOrganismeAgreements
      transporterReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
      traderReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

describe("Mutation.createCompany", () => {
  afterEach(() => resetDatabase());

  it("should create company and userAssociation", async () => {
    const user = await userFactory();

    const companyInput = {
      siret: "12345678912345",
      gerepId: "1234",
      companyName: "Acme",
      companyTypes: ["PRODUCER"]
    };
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(data.createCompany).toMatchObject({
      siret: companyInput.siret,
      gerepId: companyInput.gerepId,
      name: companyInput.companyName,
      companyTypes: companyInput.companyTypes
    });

    const newCompanyExists = await prisma.$exists.company({
      siret: companyInput.siret
    });
    expect(newCompanyExists).toBe(true);

    const newCompanyAssociationExists = await prisma.$exists.companyAssociation(
      { company: { siret: companyInput.siret }, user: { id: user.id } }
    );
    expect(newCompanyAssociationExists).toBe(true);
  });

  it("should link to a transporterReceipt", async () => {
    const user = await userFactory();

    const transporterReceipt = await prisma.createTransporterReceipt({
      receiptNumber: "1234",
      validityLimit: "2023-03-31T00:00:00.000Z",
      department: "07"
    });
    const companyInput = {
      siret: "12345678912345",
      companyName: "Acme",
      companyTypes: ["TRANSPORTER"],
      transporterReceiptId: transporterReceipt.id
    };

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(data.createCompany.transporterReceipt).toEqual(transporterReceipt);
  });

  it("should link to a traderReceipt", async () => {
    const user = await userFactory();

    const traderReceipt = await prisma.createTraderReceipt({
      receiptNumber: "1234",
      validityLimit: "2023-03-31T00:00:00.000Z",
      department: "07"
    });
    const companyInput = {
      siret: "12345678912345",
      companyName: "Acme",
      companyTypes: ["TRADER"],
      traderReceiptId: traderReceipt.id
    };

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    // check the traderReceipt was created in db
    expect(data.createCompany.traderReceipt).toEqual(traderReceipt);
  });

  it("should create document keys", async () => {
    const user = await userFactory();

    const companyInput = {
      siret: "12345678912345",
      companyName: "Acme",
      companyTypes: ["PRODUCER"],
      documentKeys: ["key1", "key2"]
    };
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    const company = await prisma.company({ siret: companyInput.siret });
    expect(company.documentKeys).toEqual(["key1", "key2"]);
  });

  it("should throw error if the company already exist", async () => {
    const user = await userFactory();
    const company = await companyFactory();

    // try re-creating the same company
    const companyInput = {
      siret: company.siret,
      gerepId: company.gerepId,
      companyName: company.name,
      companyTypes: company.companyTypes
    };
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors, data } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(data).toBeNull();
    expect(errors[0].extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
  });

  it("should alert when a user creates too many companies", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    async function createCompany(siret: string) {
      await mutate(CREATE_COMPANY, {
        variables: {
          companyInput: {
            siret,
            gerepId: "1234",
            companyTypes: ["PRODUCER"]
          }
        }
      });
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

  it("should return an error when creating an unknown eco-organisme", async () => {
    const user = await userFactory();

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput: {
          siret: "0".repeat(14),
          companyTypes: ["ECO_ORGANISME"]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Cette entreprise ne fait pas partie de la liste des éco-organismes reconnus par Trackdéchets. Contactez-nous si vous pensez qu'il s'agit d'une erreur : hello@trackdechets.beta.gouv.fr"
      })
    ]);
  });

  it("should return an error when creating an eco-organisme without its agreement", async () => {
    const user = await userFactory();

    const companyInput = {
      siret: "0".repeat(14),
      companyTypes: ["ECO_ORGANISME"]
    };
    await prisma.createEcoOrganisme({
      address: "",
      name: "Eco-Organisme",
      siret: companyInput.siret
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "L'URL de l'agrément de l'éco-organisme est requis."
      })
    ]);
  });

  it("should allow creating a known eco-organisme with its agreement", async () => {
    const user = await userFactory();

    const companyInput = {
      siret: "0".repeat(14),
      companyTypes: ["ECO_ORGANISME"],
      ecoOrganismeAgreements: ["https://legifrance.com/agreement"]
    };
    await prisma.createEcoOrganisme({
      address: "",
      name: "Eco-Organisme",
      siret: companyInput.siret
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(data.createCompany.ecoOrganismeAgreements).toEqual(
      companyInput.ecoOrganismeAgreements
    );
  });

  it("should return an error when creating a producer company with eco-organisme agreements", async () => {
    const user = await userFactory();

    const companyInput = {
      siret: "0".repeat(14),
      companyTypes: ["PRODUCER"],
      ecoOrganismeAgreements: ["https://legifrance.com/agreement"]
    };

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate(CREATE_COMPANY, {
      variables: {
        companyInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de lier des agréments d'éco-organisme : l'entreprise n'est pas un éco-organisme."
      })
    ]);
  });
});
