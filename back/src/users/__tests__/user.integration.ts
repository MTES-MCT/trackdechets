import { resetDatabase } from "../../../integration-tests/helper";
import { prisma } from "../../generated/prisma-client";
import * as mailsHelper from "../../common/mails.helper";
import { server } from "../../server";
import { createTestClient } from "apollo-server-testing";
import { createTestClient as createIntegrationTestClient } from "apollo-server-integration-testing";
import { gql } from "apollo-server-express";
import { hash } from "bcrypt";
import { userWithCompanyFactory, userFactory } from "../../__tests__/factories";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

async function seed() {
  // John, admin of 000000000000
  const p1 = await hash("john", 10);
  await prisma.createUser({
    email: "john@td.io",
    name: "John",
    password: p1,
    isActive: true,
    companyAssociations: {
      create: {
        company: { create: { siret: "00000000000000", securityCode: 1234 } },
        role: "ADMIN"
      }
    }
  });
}

describe("User endpoint", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  test("apiKey", async () => {
    const user = await userFactory();

    const { query, setOptions } = createIntegrationTestClient({
      apolloServer: server
    });

    setOptions({ request: { user } });

    const { data } = await query("query { apiKey }");

    expect(data.apiKey).toHaveLength(40);
  });

  test("login", async () => {
    // await seed();

    const { user } = await userWithCompanyFactory("ADMIN");

    const { mutate } = createTestClient(server);
    const { data } = await mutate({
      mutation: gql`
        mutation {
          login(email: "${user.email}" , password: "pass") {
            token
          }
        }
      `
    });

    expect(data.login.token).toHaveLength(40);

    // should have created an accessToken in db
    const accessToken = await prisma.accessToken({
      token: data.login.token
    });
    expect(accessToken).not.toBeNull();
    expect(accessToken.token).toEqual(data.login.token);
  });

  test("signup", async () => {
    const userIndex =
      (await prisma
        .usersConnection()
        .aggregate()
        .count()) + 1;

    const email = `newUser_${userIndex}@td.io`;
    const mutation = `
      mutation {
        signup(
          userInfos: {
            email: "${email}"
            password: "newUserPassword"
            name: "New User"
            phone: ""
          }
        ) { id }
      }
    `;
    const { mutate } = createTestClient(server);

    const { data } = await mutate({ mutation });
    expect(data.id).not.toBeNull();

    const newUserExists = await prisma.$exists.user({ email: email });
    expect(newUserExists).toBe(true);
  });
});
