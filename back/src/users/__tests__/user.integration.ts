import { resetDatabase } from "../../../integration-tests/helper";
import { prisma } from "../../generated/prisma-client";
import * as mailsHelper from "../../common/mails.helper";
import { server } from "../../server";
import { createTestClient } from "apollo-server-testing";
import { gql } from "apollo-server-express";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("User endpoint", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  test("login", async () => {
    const { mutate } = createTestClient(server);
    const { data } = await mutate({
      mutation: gql`
        mutation {
          login(email: "john@td.io", password: "john") {
            token
          }
        }
      `
    });
    expect(data.token).not.toBeNull();
  });

  test("signup", async () => {
    const userIndex =
      (await prisma
        .usersConnection()
        .aggregate()
        .count()) + 1;
    const companyIndex =
      (await prisma
        .companiesConnection()
        .aggregate()
        .count()) + 1;
    const email = `newUser_${userIndex}@td.io`;
    const mutation = `
      mutation {
        signup(
          payload: {
            email: "${email}"
            password: "newUser"
            name: "New User"
            phone: ""
            siret: "${companyIndex}"
            companyName: "The New One"
            codeNaf: ""
            gerepId: ""
            companyTypes: [PRODUCER, COLLECTOR]
          }
        ) { token }
      }
    `;
    const { mutate } = createTestClient(server);

    const { data } = await mutate({ mutation });
    expect(data.token).not.toBeNull();

    const newUserExists = await prisma.$exists.user({ email: email });
    expect(newUserExists).toBe(true);

    const newCompanyExists = await prisma.$exists.company({
      siret: `${companyIndex}`
    });
    expect(newCompanyExists).toBe(true);
  });
});
