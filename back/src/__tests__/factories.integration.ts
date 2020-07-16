import { prisma } from "../generated/prisma-client";
import {
  userFactory,
  companyFactory,
  userWithCompanyFactory,
  formFactory,
  statusLogFactory,
  transportSegmentFactory
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
        company: { siret: string; id: string; companyTypes: [string] };
      }[];
    }>(`
        fragment UserSirets on User {
          companyAssociations {
            id,
            company {
              id
              siret
              companyTypes
            }
          }
        }
      `);

    const companyAssociations = usr.companyAssociations;
    expect(companyAssociations.length).toBe(1);
    expect([...companyAssociations[0].company.companyTypes]).toMatchObject([
      "PRODUCER"
    ]);
    expect(companyAssociations[0].company.siret).toBe(company.siret);
  });

  test("should create a user with a company of a given type", async () => {
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      "TRANSPORTER"
    );

    const usr = await prisma.user({ id: user.id }).$fragment<{
      companyAssociations: {
        id: string;
        company: { siret: string; id: string; companyTypes: [string] };
      }[];
    }>(`
        fragment UserSirets on User {
          companyAssociations {
            id,
            company {
              id
              siret
              companyTypes
            }
          }
        }
      `);

    const companyAssociations = usr.companyAssociations;
    expect(companyAssociations.length).toBe(1);
    expect(companyAssociations[0].company.siret).toBe(company.siret);

    expect(companyAssociations[0].company.companyTypes).toMatchObject([
      "TRANSPORTER"
    ]);
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

test("should create a transport segment", async () => {
  const usr = await userFactory();

  const frm = await formFactory({
    ownerId: usr.id
  });

  const newTransportSegment = await transportSegmentFactory({
    formId: frm.id,
    segmentPayload: { transporterCompanySiret: "1234" }
  });

  expect(newTransportSegment.id).toBeTruthy();
  expect(newTransportSegment.transporterCompanySiret).toEqual("1234");
  //check reverse access
  const segments = await prisma.form({ id: frm.id }).transportSegments();
  expect(segments.length).toEqual(1);
});
