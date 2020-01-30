import { userFactory } from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { server } from "../../../server";
import { prisma } from "../../../generated/prisma-client";
import { createTestClient } from "apollo-server-integration-testing";

describe("Create company endpoint", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  test("should create company and userAssociation", async () => {
    const user = await userFactory();

    const siret = "12345678912345";

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
    const { mutate, setOptions } = createTestClient({ apolloServer: server });
    setOptions({
      request: {
        user
      }
    });

    const { data } = await mutate(mutation);
    expect(data.id).not.toBeNull();

    const newCompanyExists = await prisma.$exists.company({ siret });
    expect(newCompanyExists).toBe(true);

    const newCompanyAssociationExists = await prisma.$exists.companyAssociation(
      { company: { siret }, user: { id: user.id } }
    );
    expect(newCompanyAssociationExists).toBe(true);
  });
});
