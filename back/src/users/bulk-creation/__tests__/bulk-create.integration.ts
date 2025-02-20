import {
  resetCache,
  resetDatabase
} from "../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../mailer/mailing";
import { sirenify } from "../sirene";
import { companyFactory, userFactory } from "../../../__tests__/factories";
import { bulkCreate, Opts } from "../index";
import { searchCompany } from "../../../companies/search";

// No mails
jest.mock("../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

jest.mock("../sirene");
(sirenify as jest.Mock).mockImplementation(company => {
  if (company.siret === "85001946400021") {
    return {
      ...company,
      name: "NAME FROM SIRENE",
      address: "40 boulevard Voltaire 13001 Marseille",
      codeNaf: "62.01Z",
      latitude: 1,
      longitude: 1
    };
  }

  if (company.siret === "81343950200028") {
    return {
      ...company,
      name: "NAME FROM SIRENE",
      address: "4 boulevard Pasteur 44100 Nantes",
      codeNaf: "62.01Z",
      latitude: 1,
      longitude: 1
    };
  }
});

jest.mock("../../../companies/search", () => ({
  searchCompany: jest.fn().mockResolvedValue({ etatAdministratif: "A" })
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
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    jest.resetAllMocks();
  });

  (searchCompany as jest.Mock).mockImplementation((cue: string) => {
    if (cue === "85001946400021") {
      return {
        siret: "85001946400021",
        name: "Code en stock",
        statutDiffusionEtablissement: "O",
        etatAdministratif: "A",
        addressVoie: "40 boulevard Voltaire",
        addressPostalCode: "13001",
        addressCity: "Marseille",
        codePaysEtrangerEtablissement: ""
      };
    }
    if (cue === "81343950200028") {
      return {
        siret: "81343950200028",
        name: "Frontier SAS",
        statutDiffusionEtablissement: "O",
        etatAdministratif: "A",
        addressVoie: "4 boulevard Pasteur",
        addressPostalCode: "44100",
        addressCity: "Nantes",
        codePaysEtrangerEtablissement: ""
      };
    }
  });

  // CSV files are read from __tests__/csv folder
  //
  // In the test data we have
  //
  // 2 companies:
  // - Code en Stock 85001946400021
  // - Frontier SAS 81343950200028
  //
  // and 3 users
  // - john.snow@trackdechets.fr ADMIN of Code en Stock
  // - arya.stark@trackdechets.fr ADMIN of Frontier
  // - tyrion.lannister@trackdechets.fr who is MEMBER of both
  //
  // bulkCreate is called twice in all tests to verify
  // the idempotency of the function

  const opts: Opts = {
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

  afterEach(async () => {
    await resetDatabase();
    await resetCache();
  });

  test("create companies and users from scratch", async () => {
    await bulkCreateIdempotent();

    await expectNumberOfRecords(2, 3, 4);

    // check fields are OK for first user
    const john = await prisma.user.findUniqueOrThrow({
      where: { email: "john.snow@trackdechets.fr" }
    });
    expect(john.name).toEqual("john.snow@trackdechets.fr");
    expect(john.isActive).toEqual(true);
    expect(john.activatedAt).toBeTruthy();
    expect(john.firstAssociationDate).toBeTruthy();

    // check fields are OK for first company
    const codeEnStock = await prisma.company.findUniqueOrThrow({
      where: { siret: "85001946400021" }
    });
    expect(codeEnStock.name).toEqual("NAME FROM SIRENE");
    expect(codeEnStock.givenName).toEqual("Code en Stock");
    expect(codeEnStock.companyTypes).toEqual(["PRODUCER"]);
    expect(codeEnStock.wasteProcessorTypes).toEqual([]);
    expect(codeEnStock.wasteVehiclesTypes).toEqual([]);
    expect(codeEnStock.collectorTypes).toEqual([]);
    expect(codeEnStock.codeNaf).toEqual("62.01Z");
    expect(codeEnStock.website).toEqual("https://codeenstock.trackdechets.fr");
    expect(codeEnStock.gerepId).toEqual("1234");
    expect(codeEnStock.contactPhone).toEqual("0600000000");
    expect(codeEnStock.contact).toEqual("Marcel Machin");

    // check fields are OK for second company
    const frontier = await prisma.company.findUniqueOrThrow({
      where: { siret: "81343950200028" }
    });
    expect(frontier.companyTypes).toEqual(["PRODUCER", "WASTEPROCESSOR"]);
    expect(frontier.wasteProcessorTypes).toEqual(["OTHER_DANGEROUS_WASTES"]);
    expect(frontier.wasteVehiclesTypes).toEqual([]);
    expect(frontier.collectorTypes).toEqual([]);
    expect(frontier.name).toEqual("NAME FROM SIRENE");
    expect(frontier.givenName).toEqual("Frontier SAS");
    // empty contact cell
    expect(frontier.contact).toEqual("");
  }, 10000);

  test("already existing company", async () => {
    // assume Code en Stock was already created
    const codeEnStock = await companyFactory({ siret: "85001946400021" });

    await bulkCreateIdempotent();

    await expectNumberOfRecords(2, 3, 4);

    // Code en stock should be untouched
    expect(
      await prisma.company.findUnique({ where: { siret: "85001946400021" } })
    ).toEqual(codeEnStock);
  }, 10000);

  test("already existing user", async () => {
    // assume a user with this email already exists
    const {
      firstAssociationDate: _1,
      updatedAt: _2,
      ...john
    } = await userFactory({
      email: "john.snow@trackdechets.fr"
    });

    await bulkCreateIdempotent();

    await expectNumberOfRecords(2, 3, 4);
    const { firstAssociationDate, updatedAt, ...dbJohn } =
      await prisma.user.findUniqueOrThrow({
        where: { email: "john.snow@trackdechets.fr" }
      });

    // john snow user should be untouched
    expect(dbJohn).toEqual(john);
    expect(firstAssociationDate).toBeTruthy();

    // associations should exist between John Snow and Code en Stock
    const associations = await prisma.companyAssociation.findMany({
      where: { user: { id: john.id }, company: { siret: "85001946400021" } }
    });
    expect(associations).toHaveLength(1);
    expect(associations[0].role).toEqual("ADMIN");
  }, 10000);

  test("already existing user with existing role in company", async () => {
    // John Snow and Code en Stock already exist
    const john = await userFactory({ email: "john.snow@trackdechets.fr" });
    const codeEnStock = await companyFactory({ siret: "85001946400021" });
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
    expect(
      await prisma.user.findUnique({ where: { email: john.email } })
    ).toEqual(john);
    // Code en Stock should be untouched
    expect(
      await prisma.company.findUnique({ where: { siret: codeEnStock.siret! } })
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
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash"
      }
    });

    await bulkCreateIdempotent();

    await expectNumberOfRecords(3, 3, 5);

    // John Snow user should be created
    const john = await prisma.user.findUniqueOrThrow({
      where: { email: "john.snow@trackdechets.fr" }
    });

    // and pending invitation converted into an association
    const associations = await prisma.companyAssociation.findMany({
      where: { user: { id: john.id }, company: { siret: company.siret } }
    });

    expect(associations).toHaveLength(1);
    expect(associations[0].role).toEqual("MEMBER");

    // invitation should be marked as joined
    const updatedInvitation = await prisma.userAccountHash.findUniqueOrThrow({
      where: {
        id: invitation.id
      }
    });
    expect(updatedInvitation.acceptedAt).not.toBeNull();
  }, 10000);

  test("role in csv already in pending invitation", async () => {
    // assume John Snow was already invited to Trackdéchets
    const company = await companyFactory({ siret: "85001946400021" });
    const invitation = await prisma.userAccountHash.create({
      data: {
        email: "john.snow@trackdechets.fr",
        companySiret: company.siret!,
        role: "MEMBER",
        hash: "hash"
      }
    });

    await bulkCreateIdempotent();
    await expectNumberOfRecords(2, 3, 4);

    const john = await prisma.user.findUniqueOrThrow({
      where: { email: "john.snow@trackdechets.fr" }
    });

    // pending invitation should have priority
    const associations = await prisma.companyAssociation.findMany({
      where: { user: { id: john.id }, company: { siret: company.siret } }
    });
    expect(associations).toHaveLength(1);
    expect(associations[0].role).toEqual("MEMBER");

    // invitation should be marked as joined
    const updatedInvitation = await prisma.userAccountHash.findUniqueOrThrow({
      where: {
        id: invitation.id
      }
    });
    expect(updatedInvitation.acceptedAt).not.toBeNull();
  }, 10000);

  test("should fill company's splitted address", async () => {
    // Given

    // When
    await bulkCreateIdempotent();

    // Then
    // Check fields are OK for first company
    const codeEnStock = await prisma.company.findUniqueOrThrow({
      where: { siret: "85001946400021" }
    });
    expect(codeEnStock.address).toEqual(
      "40 boulevard Voltaire 13001 Marseille"
    );
    expect(codeEnStock.street).toEqual("40 boulevard Voltaire");
    expect(codeEnStock.postalCode).toEqual("13001");
    expect(codeEnStock.city).toEqual("Marseille");
    expect(codeEnStock.country).toEqual("FR");

    // Check fields are OK for second company
    const frontierSAS = await prisma.company.findUniqueOrThrow({
      where: { siret: "81343950200028" }
    });
    expect(frontierSAS.address).toEqual("4 boulevard Pasteur 44100 Nantes");
    expect(frontierSAS.street).toEqual("4 boulevard Pasteur");
    expect(frontierSAS.postalCode).toEqual("44100");
    expect(frontierSAS.city).toEqual("Nantes");
    expect(frontierSAS.country).toEqual("FR");
  }, 10000);
});
