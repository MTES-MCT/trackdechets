import {
  userWithCompanyFactory,
  formFactory,
  companyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("{ mutation { markAsSent } }", () => {
  afterAll(() => resetDatabase());

  test("the emitter of the BSD can send it when it's sealed", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const recipientCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsSent(id: "${form.id}", sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe"}) {
          id
        }
      }
    `;

    await mutate(mutation);

    form = await prisma.form({ id: form.id });

    expect(form.status).toEqual("SENT");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: { form: { id: form.id }, user: { id: user.id }, status: "SENT" }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("the recipient of the BSD can send it when it's sealed", async () => {
    const { user, company: recipientCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsSent(id: "${form.id}", sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe"}) {
          id
        }
      }
    `;

    await mutate(mutation);

    form = await prisma.form({ id: form.id });

    expect(form.status).toEqual("SENT");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: { form: { id: form.id }, user: { id: user.id }, status: "SENT" }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("the emitter of the BSD can send it when it's a draft", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const recipientCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsSent(id: "${form.id}", sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe"}) {
          id
        }
      }
    `;

    await mutate(mutation);

    form = await prisma.form({ id: form.id });

    expect(form.status).toEqual("SENT");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: { form: { id: form.id }, user: { id: user.id }, status: "SENT" }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("the recipient of the BSD can send it when it's a draft", async () => {
    const { user, company: recipientCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    let form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsSent(id: "${form.id}", sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe"}) {
          id
        }
      }
    `;

    await mutate(mutation);

    form = await prisma.form({ id: form.id });

    expect(form.status).toEqual("SENT");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: { form: { id: form.id }, user: { id: user.id }, status: "SENT" }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("should fail if user is neither emitter or recipient", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: emitterCompany.siret
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsSent(id: "${form.id}", sentInfo: { sentAt: "2018-12-11T00:00:00.000Z", sentBy: "John Doe"}) {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation);
    expect(errors[0].extensions.code).toBe("FORBIDDEN");

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toEqual("SEALED");
  });
});
