import { resetDatabase } from "integration-tests/helper";
import prisma from "src/prisma";
import * as mailsHelper from "../../../mailer/mailing";
import { companyFactory, userFactory } from "../../../__tests__/factories";
import { bulkCreate } from "../index";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

jest.mock("../sirene", () => ({
  getCompanyThrottled: jest.fn(() =>
    Promise.resolve({
      naf: "62.01Z",
      name: "NAME FROM SIRENE"
    })
  ),
  sirenify: jest.fn(company =>
    Promise.resolve({
      ...company,
      name: "NAME FROM SIRENE",
      codeNaf: "62.01Z"
    })
  )
}));

export interface CompanyInfo {
  etablissement: {
    unite_legale: {
      denomination: string;
    };
    activite_principale: string;
  };
}

describe("bulk create users and companies from csv files", () => {
  // CSV files are read from __tests__/csv folder
  //
  // In the test data we have
  //
  // 2 companies:
  // - Code en Stock 85001946400013
  // - Frontier SAS 81343950200028
  //
  // and 3 users
  // - john.snow@trackdechets.fr ADMIN of Code en Stock
  // - arya.stark@trackdechets.fr ADMIN of Frontier
  // - tyrion.lannister@trackdechets.fr who is MEMBER of both
  //
  // bulkCreate is called twice in all tests to verify
  // the idempotency of the function

  const opts = {
    validateOnly: false,
    csvDir: `${__dirname}/csv`,
    console: {
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      log: global.console.log
    }
  };

  async function bulkCreateIdempotent() {
    await bulkCreate(opts);
    await bulkCreate(opts);
  }

  async function expectNumberOfRecords(
    companyCount: number,
    userCount: number,
    associationCount: number
  ) {
    const companies = await prisma.company.findMany();
    const users = await prisma.user.findMany();
    const associations = await prisma.companyAssociation.findMany();
    expect(companies).toHaveLength(companyCount);
    expect(users).toHaveLength(userCount);
    expect(associations).toHaveLength(associationCount);
  }

  afterEach(() => resetDatabase());

  test("create companies and users from scratch", async () => {
    await bulkCreateIdempotent();

    await expectNumberOfRecords(2, 3, 4);

    // check fields are OK for first user
    const john = await prisma.user.findOne({
      where: { email: "john.snow@trackdechets.fr" }
    });
    expect(john.name).toEqual("john.snow@trackdechets.fr");
    expect(john.isActive).toEqual(true);

    // check fields are OK for first company
    const codeEnStock = await prisma.company.findOne({
      where: { siret: "85001946400013" }
    });
    expect(codeEnStock.name).toEqual("NAME FROM SIRENE");
    expect(codeEnStock.givenName).toEqual("Code en Stock");
    expect(codeEnStock.companyTypes).toEqual(["PRODUCER"]);
    expect(codeEnStock.codeNaf).toEqual("62.01Z");
    expect(codeEnStock.website).toEqual("https://codeenstock.trackdechets.fr");
    expect(codeEnStock.gerepId).toEqual("1234");
    expect(codeEnStock.contactPhone).toEqual("0600000000");
  }, 10000);

  test("already existing company", async () => {
    // assume Code en Stock was already created
    const codeEnStock = await companyFactory({ siret: "85001946400013" });

    await bulkCreateIdempotent();

    await expectNumberOfRecords(2, 3, 4);

    // Code en stock should be untouched
    expect(
      await prisma.company.findOne({ where: { siret: "85001946400013" } })
    ).toEqual(codeEnStock);
  }, 10000);

  test("already existing user", async () => {
    // assume a user with this email already exists
    const john = await userFactory({ email: "john.snow@trackdechets.fr" });

    await bulkCreateIdempotent();

    await expectNumberOfRecords(2, 3, 4);

    // john snow user should be untouched
    expect(
      await prisma.user.findOne({
        where: { email: "john.snow@trackdechets.fr" }
      })
    ).toEqual(john);

    // associations should exist between John Snow and Code en Stock
    const associations = await prisma.companyAssociation.findMany({
      where: { user: { id: john.id }, company: { siret: "85001946400013" } }
    });
    expect(associations).toHaveLength(1);
    expect(associations[0].role).toEqual("ADMIN");
  }, 10000);

  test("already existing user with existing role in company", async () => {
    // John Snow and Code en Stock already exist
    const john = await userFactory({ email: "john.snow@trackdechets.fr" });
    const codeEnStock = await companyFactory({ siret: "85001946400013" });
    // and John Snow is member of Code en Stock
    const role = await prisma.companyAssociation.create({
      data: {
        user: { connect: { id: john.id } },
        company: { connect: { id: codeEnStock.id } },
        role: "MEMBER"
      }
    });

    await bulkCreateIdempotent();

    await expectNumberOfRecords(2, 3, 4);
    // John Snow should be untouched
    expect(await prisma.user.findOne({ where: { email: john.email } })).toEqual(
      john
    );

    // Code en Stock should be untouched
    expect(
      await prisma.company.findOne({ where: { siret: codeEnStock.siret } })
    ).toEqual(codeEnStock);
    // Association should be there
    const associations = await prisma.companyAssociation.findMany({
      where: { user: { id: john.id }, company: { siret: codeEnStock.siret } }
    });
    expect(associations).toHaveLength(1);
    expect(associations[0]).toEqual(role);
  }, 10000);

  test("user with pending invitation", async () => {
    const company = await companyFactory({ siret: "51212357100022" });

    // John Snow has been invited to company 51212357100022
    const invitation = await prisma.userAccountHash.create({
      data: {
        email: "john.snow@trackdechets.fr",
        companySiret: company.siret,
        role: "MEMBER",
        hash: "hash"
      }
    });

    await bulkCreateIdempotent();

    await expectNumberOfRecords(3, 3, 5);

    // John Snow user should be created
    const john = await prisma.user.findOne({
      where: { email: "john.snow@trackdechets.fr" }
    });

    // and pending invitation converted into an association
    const associations = await prisma.companyAssociation.findMany({
      where: { user: { id: john.id }, company: { siret: company.siret } }
    });

    expect(associations).toHaveLength(1);
    expect(associations[0].role).toEqual("MEMBER");

    // invitation should be marked as joined
    const updatedInvitation = await prisma.userAccountHash.findOne({
      where: {
        id: invitation.id
      }
    });
    expect(updatedInvitation.acceptedAt).not.toBeNull();
  }, 10000);

  test("role in csv already in pending invitation", async () => {
    // assume John Snow was already invited to Trackdéchets
    const company = await companyFactory({ siret: "85001946400013" });
    const invitation = await prisma.userAccountHash.create({
      data: {
        email: "john.snow@trackdechets.fr",
        companySiret: company.siret,
        role: "MEMBER",
        hash: "hash"
      }
    });

    await bulkCreateIdempotent();
    await expectNumberOfRecords(2, 3, 4);

    const john = await prisma.user.findOne({
      where: { email: "john.snow@trackdechets.fr" }
    });

    // pending invitation should have priority
    const associations = await prisma.companyAssociation.findMany({
      where: { user: { id: john.id }, company: { siret: company.siret } }
    });
    expect(associations).toHaveLength(1);
    expect(associations[0].role).toEqual("MEMBER");

    // invitation should be marked as joined
    const updatedInvitation = await prisma.userAccountHash.findOne({
      where: {
        id: invitation.id
      }
    });
    expect(updatedInvitation.acceptedAt).not.toBeNull();
  }, 10000);
});
