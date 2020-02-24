import {
  userWithCompanyFactory,
  formFactory,
  companyFactory
} from "../../../__tests__/factories";
import { createTestClient } from "apollo-server-integration-testing";
import { resetDatabase } from "../../../../integration-tests/helper";
import { server } from "../../../server";
import { prisma } from "../../../generated/prisma-client";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("{ mutation { markAsSealed } }", () => {
  afterAll(() => {
    resetDatabase();
  });

  test("the emitter of the BSD can seal it", async () => {
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

    const { mutate, setOptions } = createTestClient({ apolloServer: server });

    setOptions({
      request: {
        user
      }
    });

    const mutation = `
      mutation   {
        markAsSealed(id: "${form.id}") {
          id
        }
      }
    `;

    await mutate(mutation);

    form = await prisma.form({ id: form.id });

    expect(form.status).toEqual("SEALED");
  });

  test("the recipient of the BSD can seal it", async () => {
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

    const { mutate, setOptions } = createTestClient({ apolloServer: server });

    setOptions({
      request: {
        user
      }
    });

    const mutation = `
      mutation   {
        markAsSealed(id: "${form.id}") {
          id
        }
      }
    `;

    await mutate(mutation);

    form = await prisma.form({ id: form.id });

    expect(form.status).toEqual("SEALED");
  });
});
