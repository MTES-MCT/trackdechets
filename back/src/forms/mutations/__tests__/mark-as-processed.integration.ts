import { createTestClient } from "apollo-server-integration-testing";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";
import { server } from "../../../server";
import {
  formFactory,
  userWithCompanyFactory,
  companyFactory
} from "../../../__tests__/factories";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe("Integration / Mark as processed mutation", () => {
  let user;
  let company;
  let mutate;

  beforeAll(async () => {
    const userAndCompany = await userWithCompanyFactory("ADMIN");
    user = userAndCompany.user;
    company = userAndCompany.company;
  });

  beforeEach(() => {
    // instantiate test client
    const { mutate: m, setOptions } = createTestClient({
      apolloServer: server
    });

    setOptions({
      request: {
        user
      }
    });

    mutate = m;
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("should fail if current user is not recipient", async () => {
    const recipientCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "RECEIVED",
        recipientCompanyName: recipientCompany.name,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const mutation = `
      mutation   {
        markAsProcessed(id: "${form.id}", processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }) {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation);
    expect(errors[0].extensions.code).toBe("FORBIDDEN");
  });

  it("should mark a form as processed", async () => {
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "RECEIVED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const mutation = `
      mutation   {
        markAsProcessed(id: "${form.id}", processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }) {
          id
        }
      }
    `;

    await mutate(mutation);

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toBe("PROCESSED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: {
        form: { id: resultingForm.id },
        user: { id: user.id },
        status: "PROCESSED"
      }
    });
    expect(statusLogs.length).toEqual(1);
    expect(statusLogs[0].loggedAt).toBeTruthy();
  });

  it("should not mark a form as processed when operation code is not valid", async () => {
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "RECEIVED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const mutation = `
      mutation   {
        markAsProcessed(id: "${form.id}", processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 18",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }) {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation);

    expect(errors[0].message).toBe(
      "Cette opération de traitement n'existe pas."
    );
    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toBe("RECEIVED");

    // no statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: {
        form: { id: resultingForm.id },
        user: { id: user.id }
      }
    });
    expect(statusLogs.length).toEqual(0);
  });

  it("should mark a form as AWAITING_GROUP when operation implies so", async () => {
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "RECEIVED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const mutation = `
      mutation   {
        markAsProcessed(id: "${form.id}", processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
          nextDestination: {
            processingOperation: "D 1"
            company: {
              mail: "m@m.fr"
              siret: "97874512984578"
              name: "company"
              phone: "0101010101"
              contact: "The famous bot"
              address: "A beautiful place..."
            }
          }
        }) {
          id
        }
      }
    `;

    await mutate(mutation);

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toBe("AWAITING_GROUP");
  });

  it("should mark a form as NO_TRACEABILITY when user declares it", async () => {
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "RECEIVED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const mutation = `
      mutation   {
        markAsProcessed(id: "${form.id}", processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
          noTraceability: true
        }) {
          id
        }
      }
    `;

    await mutate(mutation);

    const resultingForm = await prisma.form({ id: form.id });
    expect(resultingForm.status).toBe("NO_TRACEABILITY");
  });
});
