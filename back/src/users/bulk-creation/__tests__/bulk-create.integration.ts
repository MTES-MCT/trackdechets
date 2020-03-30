import * as mailsHelper from "../.../../../../common/mails.helper";
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
  it("should create companies, users and company associations", async () => {
    await bulkCreate();
    const users = await prisma.users();
    expect(users).toHaveLength(1);
  });
});
