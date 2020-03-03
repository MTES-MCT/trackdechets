import { prisma } from "../generated/prisma-client";
import {
  userFactory,
  companyFactory,
  userWithCompanyFactory,
  formFactory,
  statusLogFactory
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
    expect(company.siret.length).toBe(14);
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

  test("should create a form", async () => {
    const usr = await userFactory();

    const newfrm = await formFactory({
      ownerId: usr.id,
      opt: { emitterCompanyName: "somecompany" }
    });

    expect(newfrm.id).toBeTruthy();
    expect(newfrm.emitterCompanyName).toBe("somecompany");
  });

  test("should create a status log", async () => {
    const usr = await userFactory();

    const frm = await formFactory({
      ownerId: usr.id
    });

    const newStatusLog = await statusLogFactory({
      userId: usr.id,
      status: "SEALED",
      formId: frm.id
    });

    expect(newStatusLog.id).toBeTruthy();
  });

  test("should create a status log in the past", async () => {
    const usr = await userFactory();

    const frm = await formFactory({
      ownerId: usr.id
    });

    const newStatusLog = await statusLogFactory({
      userId: usr.id,
      status: "SEALED",
      formId: frm.id,
      opt: { loggedAt: "2017-03-25" }
    });

    expect(newStatusLog.id).toBeTruthy();

    expect(newStatusLog.loggedAt).toEqual("2017-03-25T00:00:00.000Z");
  });
});
