import * as mailsHelper from "../../../common/mails.helper";
import { bulkCreate } from "../index";
import { prisma } from "../../../generated/prisma-client";
import { resetDatabase } from "../../../../integration-tests/helper";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

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

  afterEach(() => resetDatabase());

  const opts = {
    validateOnly: false,
    csvDir: `${__dirname}/csv`
  };

  it("should create companies, users and company associations", async () => {
    await bulkCreate(opts);
    const users = await prisma.users();
    expect(users).toHaveLength(3);

    // check fields are OK for first user
    const john = await prisma.user({ email: "john.snow@trackdechets.fr" });
    expect(john.name).toEqual("john.snow@trackdechets.fr");
    expect(john.isActive).toEqual(true);

    const companies = await prisma.companies();
    expect(companies).toHaveLength(2);

    // check fields are OK for first company
    const codeEnStock = await prisma.company({ siret: "85001946400013" });
    expect(codeEnStock.name).toEqual("CODE EN STOCK");
    expect(codeEnStock.givenName).toEqual("Code en Stock");
    expect(codeEnStock.companyTypes).toEqual(["PRODUCER"]);
    expect(codeEnStock.codeNaf).toEqual("62.01Z");
    expect(codeEnStock.website).toEqual("https://codeenstock.trackdechets.fr");
    expect(codeEnStock.gerepId).toEqual("1234");
    expect(codeEnStock.contactPhone).toEqual("0600000000");

    const associations = await prisma.companyAssociations();
    expect(associations).toHaveLength(4);
  });
});
