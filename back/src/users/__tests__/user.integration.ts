import { execute, resetDatabase } from "../../../integration-tests/helper";
import { prisma } from "../../generated/prisma-client";
import * as mailsHelper from "../../common/mails.helper";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("User endpoint", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  test("login", async () => {
    const query = `
      mutation {
        login(email: "john@td.io", password: "john") { token }
      }
    `;

    const { data } = await execute<{ token: string }>(query);
    expect(data.token).not.toBeNull();
  });

  test("signup", async () => {
    const query = `
      mutation {
        signup(
          payload: {
            email: "newUser@td.io"
            password: "newUser"
            name: "New User"
            phone: ""
            siret: "22222222222222"
            companyName: "The New One"
            codeNaf: ""
            gerepId: ""
            companyTypes: [PRODUCER, COLLECTOR]
          }
        ) { token }
      }
    `;

    const { data } = await execute<{ token: string }>(query);
    expect(data.token).not.toBeNull();

    const newUserExists = await prisma.$exists.user({ email: "newUser@td.io" });
    expect(newUserExists).toBe(true);

    const newCompanyExists = await prisma.$exists.company({
      siret: "22222222222222"
    });
    expect(newCompanyExists).toBe(true);
  });
});
