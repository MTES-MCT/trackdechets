import { format } from "date-fns";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { PROCESSING_OPERATIONS } from "../../../../common/constants";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { allowedFormats } from "../../../../common/dates";
import { Status } from "@prisma/client";

jest.mock("axios", () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} }))
  }
}));

const MARK_AS_PROCESSED = `
  mutation MarkAsProcessed($id: ID!, $processedInfo: ProcessedFormInput!) {
    markAsProcessed(id: $id, processedInfo: $processedInfo) {
      id
      processingOperationDescription
    }
  }
`;

describe("mutation.markAsProcessed", () => {
  afterAll(() => resetDatabase());

  it("should fail if current user is not recipient", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const recipientCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: recipientCompany.name,
        recipientCompanySiret: recipientCompany.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });
    expect(errors[0].extensions.code).toBe("FORBIDDEN");
  });

  it("should mark a form as processed", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("PROCESSED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: resultingForm.id },
        user: { id: user.id },
        status: "PROCESSED"
      }
    });
    expect(statusLogs.length).toEqual(1);
    expect(statusLogs[0].loggedAt).toBeTruthy();
  });

  it("should fill the description with the operation's", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const processingOperation = PROCESSING_OPERATIONS.find(
      operation => operation.code === "D 1"
    );
    const { mutate } = makeClient(user);
    const {
      data: {
        markAsProcessed: { processingOperationDescription }
      }
    } = await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDone: processingOperation.code,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });
    expect(processingOperationDescription).toBe(
      processingOperation.description
    );
  });

  it("should not mark a form as processed when operation code is not valid", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 18",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });

    expect(errors[0].message).toBe(
      "Cette opération d’élimination / valorisation n'existe pas."
    );
    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("ACCEPTED");

    // no statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: resultingForm.id },
        user: { id: user.id }
      }
    });
    expect(statusLogs.length).toEqual(0);
  });

  it("should mark a form as AWAITING_GROUP when operation implies so", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          nextDestination: {
            processingOperation: "D 1",
            company: {
              mail: "m@m.fr",
              siret: "97874512984578",
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("AWAITING_GROUP");
  });

  it("should return an error when providing a next destination for a non-grouping waste code", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "R 1",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          nextDestination: {
            processingOperation: "D 1",
            company: {
              mail: "m@m.fr",
              siret: "97874512984578",
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "L'opération de traitement renseignée ne permet pas de destination ultérieure"
      })
    ]);
  });

  it("should mark a form as NO_TRACEABILITY when user declares it", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 13",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1",
            company: {
              mail: "m@m.fr",
              siret: "97874512984578",
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("NO_TRACEABILITY");
  });

  it("should set country to FR by default", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          nextDestination: {
            processingOperation: "D 1",
            company: {
              mail: "m@m.fr",
              siret: "0".repeat(14),
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm).toMatchObject({
      status: "AWAITING_GROUP",
      nextDestinationCompanyCountry: "FR"
    });
  });

  it("should add a foreign next destination", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          nextDestination: {
            processingOperation: "D 1",
            company: {
              mail: "m@m.fr",
              siret: null,
              country: "DE",
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("AWAITING_GROUP");
    expect(resultingForm.nextDestinationCompanyCountry).toBe("DE");
  });

  it("should disallow a missing siret for a french next destination", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          nextDestination: {
            processingOperation: "D 1",
            company: {
              mail: "m@m.fr",
              country: "FR",
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Destination ultérieure prévue: Le siret de l'entreprise est obligatoire"
      })
    ]);
  });

  it("should mark appendix2 forms as grouped", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED"
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: { appendix2Forms: { connect: [{ id: appendix2.id }] } }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });

    const appendix2grouped = await prisma.form.findUnique({
      where: { id: appendix2.id }
    });
    expect(appendix2grouped.status).toEqual("PROCESSED");
  });

  test.each(allowedFormats)("%p is a valid format for processedAt", async f => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.ACCEPTED,
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const processedAt = new Date("2019-10-04");

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          processedBy: "A simple bot",
          processedAt: format(processedAt, f)
        }
      }
    });

    const resultingForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe(Status.PROCESSED);
    expect(resultingForm.processedAt).toEqual(processedAt);
  });
});
