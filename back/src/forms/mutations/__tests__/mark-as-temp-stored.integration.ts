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

describe("{ mutation { markAsTempStored } }", () => {
  afterAll(() => resetDatabase());

  test("the temp storer of the BSD can mark it as TEMP_STORED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        temporaryStorageDetail: { create: {} }
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsTempStored(id: "${form.id}", tempStoredInfos: {
          wasteAcceptationStatus: ACCEPTED,
          wasteRefusalReason: ""
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4
          quantityType: REAL
        }) {
          id
        }
      }
    `;

    await mutate(mutation);

    const formAfterMutation = await prisma.form({ id: form.id });

    expect(formAfterMutation.status).toEqual("TEMP_STORED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "TEMP_STORED"
      }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("the temp storer of the BSD can mark it as REFUSED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        temporaryStorageDetail: { create: {} }
      }
    });

    const { mutate } = makeClient(user);

    const mutation = `
      mutation   {
        markAsTempStored(id: "${form.id}", tempStoredInfos: {
          wasteAcceptationStatus: REFUSED,
          wasteRefusalReason: "Thats isn't what I was expecting man !"
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 0
          quantityType: REAL
        }) {
          id
        }
      }
    `;

    await mutate(mutation);

    const formAfterMutation = await prisma.form({ id: form.id });

    expect(formAfterMutation.status).toEqual("REFUSED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "REFUSED"
      }
    });
    expect(statusLogs.length).toEqual(1);
  });
});
