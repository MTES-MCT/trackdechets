import { resetDatabase } from "../../../integration-tests/helper";
import { prisma } from "../../generated/prisma-client";
import * as mailsHelper from "../../common/mails.helper";
import { server } from "../../server";
import { createTestClient } from "apollo-server-testing";
import { gql } from "apollo-server-express";
import { hash } from "bcrypt";
import { userWithCompanyFactory } from "../../__tests__/factories";

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
    expect(data.token).not.toBeNull();
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
            password: "newUser"
            name: "New User"
            phone: ""
          }
        )
      }
    `;
    const { mutate } = createTestClient(server);

    const { data } = await mutate({ mutation });
    expect(data.token).not.toBeNull();

    const newUserExists = await prisma.$exists.user({ email: email });
    expect(newUserExists).toBe(true);
  });
});
