import prisma from "../prisma";
import { resetDatabase } from "../../integration-tests/helper";
import {
  companyFactory,
  formFactory,
  siretify,
  statusLogFactory,
  transportSegmentFactory,
  userFactory,
  userWithCompanyFactory,
  transporterReceiptFactory
} from "./factories";

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
    expect(company.siret!.length).toBe(14);
  });

  test("should create a user with a company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const usr = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        companyAssociations: {
          select: {
            id: true,
            company: {
              select: {
                id: true,
                siret: true,
                companyTypes: true
              }
            }
          }
        }
      }
    });

    const companyAssociations = usr!.companyAssociations;
    expect(companyAssociations.length).toBe(1);
    expect([...companyAssociations[0].company.companyTypes]).toMatchObject([
      "PRODUCER",
      "TRANSPORTER",
      "WASTEPROCESSOR"
    ]);
    expect(companyAssociations[0].company.siret).toBe(company.siret);
  });

  test("should create a user with a company of a given type", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      companyTypes: { set: ["TRANSPORTER"] }
    });

    const usr = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        companyAssociations: {
          select: {
            id: true,
            company: {
              select: {
                id: true,
                siret: true,
                companyTypes: true
              }
            }
          }
        }
      }
    });

    const companyAssociations = usr!.companyAssociations;
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
      opt: { loggedAt: new Date("2017-03-25") }
    });

    expect(newStatusLog.id).toBeTruthy();

    expect(newStatusLog.loggedAt).toEqual(new Date("2017-03-25T00:00:00.000Z"));
  });
});

test("should create a transport segment", async () => {
  const usr = await userFactory();

  const frm = await formFactory({
    ownerId: usr.id
  });
  const transporterCompanySiret = siretify(4);
  const newTransportSegment = await transportSegmentFactory({
    formId: frm.id,
    segmentPayload: { transporterCompanySiret }
  });

  expect(newTransportSegment.id).toBeTruthy();
  expect(newTransportSegment.transporterCompanySiret).toEqual(
    transporterCompanySiret
  );
  //check reverse access
  const transporters = await prisma.form
    .findUnique({ where: { id: frm.id } })
    .transporters({ where: { number: { gte: 2 } } });
  expect(transporters!.length).toEqual(1);
});

test("should create a transporter receipt and associate it to a company", async () => {
  const company = await companyFactory();

  const receipt = await transporterReceiptFactory({ company });

  const retrievedCompany = await prisma.company.findUnique({
    where: { id: company.id }
  });

  expect(retrievedCompany?.transporterReceiptId).toEqual(receipt.id);
});
