import { prisma } from "../generated/prisma-client";
import {
  userFactory,
  companyFactory,
  userWithCompanyFactory
} from "./factories";
import { resetDatabase } from "../../integration-tests/helper";

describe("Test Factories", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  test("should create a user", async () => {
    const usr = await userFactory();

    expect(usr.id).toBeTruthy();
  });

  test("should create a company", async () => {
    const company = await companyFactory();

    expect(company.id).toBeTruthy();
  });

  test("should create a user with a company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const usr = await prisma.user({ id: user.id }).$fragment<{
      companyAssociations: {
        id: string;
        company: { siret: string; id: string };
      }[];
    }>(`
        fragment UserSirets on User {
          companyAssociations {
            id,
            company {
              id
              siret
            }
          }
        }
      `);

    const companyAssociations = usr.companyAssociations;
    expect(companyAssociations.length).toBe(1);
    expect(companyAssociations[0].company.siret).toBe(company.siret);
  });
});
