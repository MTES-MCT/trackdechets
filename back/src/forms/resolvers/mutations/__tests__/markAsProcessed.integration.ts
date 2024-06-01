import { format } from "date-fns";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { PROCESSING_OPERATIONS } from "@td/constants";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { allowedFormats } from "../../../../common/dates";
import { OperationMode, Status } from "@prisma/client";
import {
  Mutation,
  MutationMarkAsProcessedArgs
} from "../../../../generated/graphql/types";
import { operationHooksQueue } from "../../../../queue/producers/operationHook";
import { ErrorCode } from "../../../../common/errors";

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
      nextDestination {
        company {
          siret
        }
      }
    }
  }
`;

describe("mutation.markAsProcessed", () => {
  afterEach(() => resetDatabase());

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
          destinationOperationMode: OperationMode.ELIMINATION,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });
    expect(errors[0].extensions?.code).toBe("FORBIDDEN");
  });

  it("should mark a form as processed", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        quantityReceived: 10,
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
          destinationOperationMode: OperationMode.VALORISATION_ENERGETIQUE,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });

    expect(errors).toBeUndefined();

    await new Promise(resolve => {
      operationHooksQueue.once("global:drained", () => resolve(true));
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { finalOperations: true }
    });
    expect(resultingForm.status).toBe("PROCESSED");
    expect(resultingForm.destinationOperationMode).toBe(
      OperationMode.VALORISATION_ENERGETIQUE
    );

    // final operation should be set
    expect(resultingForm.finalOperations).toHaveLength(1);

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

  it("should mark a form with temporary storage as processed and delete BSD suite", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
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
          destinationOperationMode: OperationMode.ELIMINATION,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });

    const updatedForm = await prisma.form.findFirstOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(updatedForm.recipientIsTempStorage).toEqual(false);
    expect(updatedForm.forwardedInId).toBeNull();
    expect(updatedForm.status).toEqual("PROCESSED");
  });

  it("should mark a form with temporary storage as AWAITING_GROUP and delete BSD suite", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });
    const nextDestination = await companyFactory();

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
              siret: nextDestination.siret,
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const updatedForm = await prisma.form.findFirstOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(updatedForm.recipientIsTempStorage).toEqual(false);
    expect(updatedForm.forwardedInId).toBeNull();
    expect(updatedForm.status).toEqual("AWAITING_GROUP");
  });

  it("should fail to mark a form with temporary storage as FOLLOWED_WITH_PNTTD if notification number is missing", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
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
            // No notificationNumber
            company: {
              mail: "m@m.fr",
              siret: null,
              vatNumber: "IE9513674T",
              country: "IE",
              name: "IE company",
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
          "Destination ultérieure : le numéro de notification est obligatoire"
      })
    ]);
  });

  it("should mark a form with temporary storage as FOLLOWED_WITH_PNTTD and delete BSD suite", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
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
            notificationNumber: "xyz",
            company: {
              mail: "m@m.fr",
              siret: null,
              vatNumber: "IE9513674T",
              country: "IE",
              name: "IE company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const updatedForm = await prisma.form.findFirstOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(updatedForm.recipientIsTempStorage).toEqual(false);
    expect(updatedForm.forwardedInId).toBeNull();
    expect(updatedForm.status).toEqual("FOLLOWED_WITH_PNTTD");
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
    } = await mutate<{
      markAsProcessed: { processingOperationDescription: string };
    }>(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDone: processingOperation!.code,
          destinationOperationMode: OperationMode.ELIMINATION,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });
    expect(processingOperationDescription).toBe(
      processingOperation!.description
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
    const resultingForm = await prisma.form.findUniqueOrThrow({
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
    const nextDestination = await companyFactory();

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
              siret: nextDestination.siret,
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
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
          destinationOperationMode: OperationMode.VALORISATION_ENERGETIQUE,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          nextDestination: {
            processingOperation: "D 1",
            company: {
              mail: "m@m.fr",
              siret: siretify(3),
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
          "L'opération de traitement renseignée ne permet pas de destination ultérieure\n" +
          "L'opération de traitement renseignée ne permet pas de destination ultérieure\n" +
          "L'opération de traitement renseignée ne permet pas de destination ultérieure\n" +
          "L'opération de traitement renseignée ne permet pas de destination ultérieure\n" +
          "L'opération de traitement renseignée ne permet pas de destination ultérieure\n" +
          "L'opération de traitement renseignée ne permet pas de destination ultérieure\n" +
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
    const nextDestination = await companyFactory();
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
              siret: nextDestination.siret,
              name: "company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("NO_TRACEABILITY");
  });

  it("should mark a form as NO_TRACEABILITY when user declares it, next destination is not provided and notificationNumber is missing", async () => {
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
            processingOperation: "D 1"
            // next destination is not provided
            // notification number not provided
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("NO_TRACEABILITY");
  });

  it.each([
    {
      wasteDetailsCode: "05 01 12*",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false
    },
    {
      wasteDetailsCode: "05 01 13",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: true
    },
    {
      wasteDetailsCode: "05 01 13",
      wasteDetailsPop: true,
      wasteDetailsIsDangerous: false
    }
  ])(
    "should fail to mark a form as NO_TRACEABILITY when user declares it and with non-french EU destination if notificationNumber is missing",
    async ({ wasteDetailsCode, wasteDetailsPop, wasteDetailsIsDangerous }) => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "ACCEPTED",
          recipientCompanyName: company.name,
          recipientCompanySiret: company.siret,
          wasteDetailsCode,
          wasteDetailsPop,
          wasteDetailsIsDangerous
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate(MARK_AS_PROCESSED, {
        variables: {
          id: form.id,
          processedInfo: {
            processingOperationDescription: "Une description",
            processingOperationDone: "D 13",
            processedBy: "A simple bot",
            processedAt: "2018-12-11T00:00:00.000Z",
            noTraceability: true,
            nextDestination: {
              //  missing notificationNumber
              processingOperation: "D 1",
              company: {
                vatNumber: "IE9513674T"
              }
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Destination ultérieure : le numéro de notification est obligatoire"
        })
      ]);
    }
  );

  it("should mark a form as NO_TRACEABILITY when user declares it and with foreign extraEuropean destination, with optional company infos", async () => {
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
          processingOperationDone: "D 13",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1",
            notificationNumber: "GB 2000 123456",
            company: {
              extraEuropeanId: "ANYTHING"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("NO_TRACEABILITY");
  });

  it("should allow empty company as nextDestination when noTraceability is true", async () => {
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
            company: null
            // no notification number
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("NO_TRACEABILITY");
  });

  it("should set nextDestinationCompanyCountry to FR by default is a SIRET is defined", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });
    const nextDestination = await companyFactory();
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
              siret: nextDestination.siret,
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

  it.each([
    {
      wasteDetailsCode: "05 01 04*",
      wasteDetailsIsDangerous: false,
      wasteDetailsPop: false
    },
    {
      wasteDetailsCode: "05 01 04",
      wasteDetailsIsDangerous: true,
      wasteDetailsPop: false
    },
    {
      wasteDetailsCode: "05 01 04",
      wasteDetailsIsDangerous: false,
      wasteDetailsPop: true
    }
  ])(
    "should require nextDestination to be registered when noTraceability is false and: %o",
    async ({ wasteDetailsCode, wasteDetailsIsDangerous, wasteDetailsPop }) => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "ACCEPTED",
          recipientCompanyName: company.name,
          recipientCompanySiret: company.siret,
          wasteDetailsCode,
          wasteDetailsIsDangerous,
          wasteDetailsPop
        }
      });
      const nextDestinationSiret = siretify(4);
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
                siret: nextDestinationSiret,
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
          message: `Destination ultérieure prévue : l'établissement avec le SIRET ${nextDestinationSiret} n'est pas inscrit sur Trackdéchets`,
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
      const resultingForm = await prisma.form.findUnique({
        where: { id: form.id }
      });
      expect(resultingForm).toMatchObject({
        status: "ACCEPTED",
        nextDestinationCompanyCountry: null
      });
    }
  );

  it("should require nextDestination to be a valid siret before checking if company is registered", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        wasteDetailsCode: "05 01 04*",
        wasteDetailsIsDangerous: false,
        wasteDetailsPop: false
      }
    });
    const nextDestinationSiret = "1234";
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
              siret: nextDestinationSiret,
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
          `Destination ultérieure prévue: ${nextDestinationSiret} n'est pas un numéro de SIRET valide\n` +
          `Destination ultérieure prévue : l'établissement avec le SIRET ${nextDestinationSiret} n'est pas inscrit sur Trackdéchets`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([
    {
      wasteDetailsCode: "05 01 04*",
      wasteDetailsIsDangerous: false,
      wasteDetailsPop: false
    },
    {
      wasteDetailsCode: "05 01 04",
      wasteDetailsIsDangerous: true,
      wasteDetailsPop: false
    },
    {
      wasteDetailsCode: "05 01 04",
      wasteDetailsIsDangerous: false,
      wasteDetailsPop: true
    }
  ])(
    "should not require nextDestination to be registered when noTraceability is true and: %o",
    async ({ wasteDetailsCode, wasteDetailsIsDangerous, wasteDetailsPop }) => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "ACCEPTED",
          recipientCompanyName: company.name,
          recipientCompanySiret: company.siret,
          wasteDetailsCode,
          wasteDetailsIsDangerous,
          wasteDetailsPop
        }
      });
      const nextDestinationSiret = siretify(4);
      const { mutate } = makeClient(user);
      const { errors } = await mutate(MARK_AS_PROCESSED, {
        variables: {
          id: form.id,
          processedInfo: {
            processingOperationDescription: "Une description",
            processingOperationDone: "D 14",
            processedBy: "A simple bot",
            processedAt: "2018-12-11T00:00:00.000Z",
            noTraceability: true,

            nextDestination: {
              processingOperation: "D 1",
              company: {
                mail: "m@m.fr",
                siret: nextDestinationSiret,
                name: "company",
                phone: "0101010101",
                contact: "The famous bot",
                address: "A beautiful place..."
              }
            }
          }
        }
      });

      expect(errors).toEqual(undefined);

      const resultingForm = await prisma.form.findUnique({
        where: { id: form.id }
      });
      expect(resultingForm).toMatchObject({
        status: "NO_TRACEABILITY",
        nextDestinationCompanyCountry: "FR"
      });
    }
  );

  it("should check nextDestination siret format when noTraceability is true", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        wasteDetailsCode: "05 01 04*",
        wasteDetailsIsDangerous: false,
        wasteDetailsPop: false
      }
    });
    const nextDestinationSiret = "12345";

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z",
          noTraceability: true,

          nextDestination: {
            processingOperation: "D 1",
            company: {
              mail: "m@m.fr",
              siret: nextDestinationSiret,
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
        message: `Destination ultérieure prévue: ${nextDestinationSiret} n'est pas un numéro de SIRET valide`,

        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([
    {
      wasteDetailsCode: "05 01 04*",
      wasteDetailsIsDangerous: false,
      wasteDetailsPop: false
    },
    {
      wasteDetailsCode: "05 01 04",
      wasteDetailsIsDangerous: true,
      wasteDetailsPop: false
    },
    {
      wasteDetailsCode: "05 01 04",
      wasteDetailsIsDangerous: false,
      wasteDetailsPop: true
    }
  ])(
    "should not require nextDestination to be registered when next destination is foreign and: %o",
    async ({ wasteDetailsCode, wasteDetailsIsDangerous, wasteDetailsPop }) => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "ACCEPTED",
          recipientCompanyName: company.name,
          recipientCompanySiret: company.siret,
          wasteDetailsCode,
          wasteDetailsIsDangerous,
          wasteDetailsPop
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
              notificationNumber: "GB 2000 123456",
              company: {
                mail: "m@m.fr",
                siret: null,
                vatNumber: "IE9513674T",
                country: "IE",
                name: "IE company",
                phone: "0101010101",
                contact: "The famous bot",
                address: "A beautiful place..."
              }
            }
          }
        }
      });

      expect(errors).toEqual(undefined);

      const resultingForm = await prisma.form.findUnique({
        where: { id: form.id }
      });
      expect(resultingForm).toMatchObject({
        status: "FOLLOWED_WITH_PNTTD",
        nextDestinationCompanyCountry: "IE"
      });
    }
  );

  it("should mark a form FOLLOWED_WITH_PNTTD with foreign next destination", async () => {
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
            notificationNumber: "xyz",
            company: {
              mail: "m@m.fr",
              siret: null,
              vatNumber: "IE9513674T",
              country: "IE",
              name: "IE company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(resultingForm.status).toBe("FOLLOWED_WITH_PNTTD");
    expect(resultingForm.nextDestinationCompanyVatNumber).toEqual("IE9513674T");
    expect(resultingForm.nextDestinationCompanyCountry).toBe("IE");
  });

  it("should mark a form FOLLOWED_WITH_PNTTD with foreign next destination and auto-guess the country", async () => {
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
            notificationNumber: "abc",
            company: {
              mail: "m@m.fr",
              siret: null,
              vatNumber: "IE9513674T",
              name: "IE company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(resultingForm.status).toBe("FOLLOWED_WITH_PNTTD");
    expect(resultingForm.nextDestinationCompanyVatNumber).toEqual("IE9513674T");
    expect(resultingForm.nextDestinationCompanyCountry).toBe("IE");
  });

  it("should mark a form with temp storage FOLLOWED_WITH_PNTTD with foreign next destination", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { status: "ACCEPTED" },
      forwardedInOpts: {
        recipientCompanySiret: company.siret,
        recipientCompanyName: company.name
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
            notificationNumber: "xyz",
            company: {
              mail: "m@m.fr",
              siret: null,
              vatNumber: "IE9513674T",
              country: "IE",
              name: "IE company",
              phone: "0101010101",
              contact: "The famous bot",
              address: "A beautiful place..."
            }
          }
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { forwardedIn: true }
    });

    expect(resultingForm.status).toBe("FOLLOWED_WITH_PNTTD");
    expect(resultingForm.forwardedIn!.nextDestinationCompanyVatNumber).toEqual(
      "IE9513674T"
    );
    expect(resultingForm.forwardedIn!.nextDestinationCompanyCountry).toBe("IE");
  });

  it("should disallow a missing siret for any next destination", async () => {
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
          "Destination ultérieure : Le siret de l'entreprise est obligatoire (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)"
      })
    ]);
  });

  it("should mark appendix2 forms as processed", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const groupedForm1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        quantityReceived: 1
      }
    });

    // it should also work for BSD with temporary storage
    const groupedForm2 = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        status: "GROUPED",
        quantityReceived: 0.02
      },
      forwardedInOpts: { quantityReceived: 0.007 }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        emitterType: "APPENDIX2",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        grouping: {
          create: [
            {
              initialFormId: groupedForm1.id,
              quantity: groupedForm1.quantityReceived!.toNumber()
            },
            {
              initialFormId: groupedForm2.id,
              quantity: groupedForm2.forwardedIn!.quantityReceived!.toNumber()
            }
          ]
        }
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          destinationOperationMode: OperationMode.ELIMINATION,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });

    const updatedGroupedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm1.id }
    });
    expect(updatedGroupedForm1.status).toEqual("PROCESSED");

    const updatedGroupedForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm2.id }
    });
    expect(updatedGroupedForm2.status).toEqual("PROCESSED");
  });

  it("should not mark appendix2 forms as processed if they are partially grouped", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        quantityReceived: 1
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: 0.1
          }
        }
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 1",
          destinationOperationMode: OperationMode.ELIMINATION,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });

    const appendix2grouped = await prisma.form.findUniqueOrThrow({
      where: { id: appendix2.id }
    });
    expect(appendix2grouped.status).toEqual("AWAITING_GROUP");
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
          destinationOperationMode: OperationMode.ELIMINATION,
          processedBy: "A simple bot",
          processedAt: format(processedAt, f)
        }
      }
    });

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe(Status.PROCESSED);
    expect(resultingForm.processedAt).toEqual(processedAt);
  });

  test("French nextDestination.company input should be optional when noTraceability is true ", async () => {
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
    const { data } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1"
          }
        }
      }
    });

    expect(data.markAsProcessed.nextDestination!.company).toBeNull();
  });

  test("French nextDestination.company input should be optional when noTraceability is true ", async () => {
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
    const { data } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1"
          }
        }
      }
    });

    expect(data.markAsProcessed.nextDestination!.company).toBeNull();
  });

  test("Foreign nextDestination.company should be optional but notificationNumber should be mandatory when noTraceability is true", async () => {
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
    const { data } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1",
            notificationNumber: "RU 2022 123456" // required if extra-EU
          }
        }
      }
    });

    expect(data.markAsProcessed.nextDestination!.company).toBeNull();

    const resultingForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    expect(resultingForm.status).toBe("NO_TRACEABILITY");
  });

  test("nextDestinationNotificationNumber should be mandatory when noTraceability is true and wasteCode is dangerous", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        wasteDetailsCode: "07 07 07*"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1",
            company: {
              extraEuropeanId: "AZERTY"
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Destination ultérieure : le numéro de notification est obligatoire"
      })
    ]);
  });

  it.each([
    {
      wasteDetailsCode: "07 07 07*",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false
    },
    {
      wasteDetailsCode: "05 01 13",
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: true
    },
    {
      wasteDetailsCode: "05 01 13",
      wasteDetailsPop: true,
      wasteDetailsIsDangerous: false
    }
  ])(
    "nextDestinationNotificationNumber should be mandatory when noTraceability is true and wasteCode is considered as dangerous. %o",
    async ({ wasteDetailsCode, wasteDetailsPop, wasteDetailsIsDangerous }) => {
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: "ACCEPTED",
          recipientCompanyName: company.name,
          recipientCompanySiret: company.siret,
          wasteDetailsCode,
          wasteDetailsPop,
          wasteDetailsIsDangerous
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "markAsProcessed">,
        MutationMarkAsProcessedArgs
      >(MARK_AS_PROCESSED, {
        variables: {
          id: form.id,
          processedInfo: {
            processingOperationDescription: "Une description",
            processingOperationDone: "D 14",
            processedBy: "A simple bot",
            processedAt: "2018-12-11T00:00:00.000Z" as any,
            noTraceability: true,
            nextDestination: {
              processingOperation: "D 1",
              company: {
                extraEuropeanId: "AZERTY"
              }
              //  missing notificationNumber
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Destination ultérieure : le numéro de notification est obligatoire"
        })
      ]);
    }
  );

  it("nextDestinationNotificationNumber should have the right format when noTraceability is true and wasteCode is considered as dangerous.", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        wasteDetailsCode: "07 07 07*" // dangerous
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1",
            company: {
              extraEuropeanId: "AZERTY"
            },
            notificationNumber: "longlonglonglong"
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Destination ultérieure : Le numéro de notification (format PP AAAA DDDRRR) ou le numéro de déclaration Annexe 7 (format A7E AAAA DDDRRR) renseigné ne correspond pas au format attendu."
      })
    ]);
  });

  test("nextDestinationNotificationNumber should not be mandatory when wasteCode is not conisdered as dangerous", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret,
        // no pop, no *, no isDangerous
        wasteDetailsCode: "07 07 07",
        wasteDetailsIsDangerous: false,
        wasteDetailsPop: false
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1",
            company: {
              extraEuropeanId: "AZERTY"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  test("nextDestinationNotificationNumber should not be mandatory when nextDestination.company is foreign when noTraceability is false", async () => {
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
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          noTraceability: true,
          nextDestination: {
            processingOperation: "D 1",
            company: {
              extraEuropeanId: "123456AZERTY"
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Destination ultérieure : le numéro de notification est obligatoire"
      })
    ]);
  });

  test("nextDestination.company should be mandatory when noTraceability is false by default", async () => {
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
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          nextDestination: {
            processingOperation: "D 1"
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Destination ultérieure : Le nom de l'entreprise est obligatoire\n" +
          "Destination ultérieure : L'adresse de l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le contact dans l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le téléphone de l'entreprise est obligatoire\n" +
          "Destination ultérieure : L'email de l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le siret de l'entreprise est obligatoire (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)"
      })
    ]);
  });

  test("nextDestination.company should be mandatory noTraceability is false explicitly", async () => {
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
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          noTraceability: false,
          nextDestination: {
            processingOperation: "D 1"
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Destination ultérieure : Le nom de l'entreprise est obligatoire\n" +
          "Destination ultérieure : L'adresse de l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le contact dans l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le téléphone de l'entreprise est obligatoire\n" +
          "Destination ultérieure : L'email de l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le siret de l'entreprise est obligatoire (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)"
      })
    ]);
  });

  test("nextDestination.company should be mandatory when noTraceability is false (by default)", async () => {
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
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          nextDestination: {
            processingOperation: "D 1"
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Destination ultérieure : Le nom de l'entreprise est obligatoire\n" +
          "Destination ultérieure : L'adresse de l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le contact dans l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le téléphone de l'entreprise est obligatoire\n" +
          "Destination ultérieure : L'email de l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le siret de l'entreprise est obligatoire (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)"
      })
    ]);
  });

  test("nextDestination.company and notificationNumber should be mandatory when company is extra-EU and when noTraceability is false", async () => {
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
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDescription: "Une description",
          processingOperationDone: "D 14",
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z" as any,
          nextDestination: {
            processingOperation: "D 1",
            company: {
              extraEuropeanId: "some internation id"
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Destination ultérieure : Le nom de l'entreprise est obligatoire\n" +
          "Destination ultérieure : L'adresse de l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le contact dans l'entreprise est obligatoire\n" +
          "Destination ultérieure : Le téléphone de l'entreprise est obligatoire\n" +
          "Destination ultérieure : L'email de l'entreprise est obligatoire\n" +
          "Destination ultérieure : le numéro de notification est obligatoire"
      })
    ]);
  });

  it("should not allow a temp storer to call markAsProcessed", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        recipientCompanySiret: tempStorer.company.siret,
        status: "ACCEPTED"
      },
      forwardedInOpts: { recipientCompanySiret: destination.company.siret }
    });
    const { mutate } = makeClient(tempStorer.user);
    const { errors } = await mutate<
      Pick<Mutation, "markAsProcessed">,
      MutationMarkAsProcessedArgs
    >(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processedAt: new Date("2022-01-01").toISOString() as any,
          processedBy: "John Snow",
          processingOperationDone: "R 1",
          destinationOperationMode: OperationMode.VALORISATION_ENERGETIQUE,
          processingOperationDescription: "Incinération"
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à marquer ce bordereau comme traité"
      })
    ]);
  });

  it("should throw an error if the BSDD is canceled", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "CANCELED",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });

    const processingOperation = PROCESSING_OPERATIONS.find(
      operation => operation.code === "D 1"
    );
    const { mutate } = makeClient(user);
    const { errors } = await mutate<{
      markAsProcessed: { processingOperationDescription: string };
    }>(MARK_AS_PROCESSED, {
      variables: {
        id: form.id,
        processedInfo: {
          processingOperationDone: processingOperation!.code,
          destinationOperationMode: OperationMode.ELIMINATION,
          processedBy: "A simple bot",
          processedAt: "2018-12-11T00:00:00.000Z"
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
      })
    ]);
  });
});
