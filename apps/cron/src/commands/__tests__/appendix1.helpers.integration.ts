import { EmitterType, Status } from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "back/src/__tests__/factories";
import { resetDatabase } from "libs/back/tests-integration";
import { cleanUnusedAppendix1ProducerBsdds } from "../appendix1.helpers";

describe("cleanUnusedAppendix1ProducerBsdds", () => {
  afterEach(resetDatabase);

  it("should delete appendix 1 that are too old to be signed", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // Item sent more than 3 days ago
    const appendix1_1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: company.siret
          }
        },
        takenOverAt: new Date("2023-01-01") // More than 3 days ago
      }
    });

    // Then 2 unsent items (sealed)
    const appendix1_2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: company.siret
          }
        }
      }
    });

    const appendix1_3 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: company.siret
          }
        }
      }
    });

    // Container form is SENT
    const container = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        emitterType: EmitterType.APPENDIX1,
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name,
        recipientCompanySiret: company.siret,
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        },
        grouping: {
          createMany: {
            data: [
              { initialFormId: appendix1_1.id, quantity: 0 },
              { initialFormId: appendix1_2.id, quantity: 0 },
              { initialFormId: appendix1_3.id, quantity: 0 }
            ]
          }
        }
      }
    });

    await cleanUnusedAppendix1ProducerBsdds();

    const grouping = await prisma.form
      .findUnique({ where: { id: container.id } })
      .grouping();
    expect(grouping?.length).toBe(1);
    expect(grouping![0].initialFormId).toBe(appendix1_1.id);
  });

  it("should not delete appendix 1 that are not too old to be signed", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // Item sent now
    const appendix1_1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        },
        takenOverAt: new Date()
      }
    });

    // Then 2 unsent items (sealed)
    const appendix1_2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });

    const appendix1_3 = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SEALED,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: company.siret,
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });

    // Container form is SENT
    const container = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        emitterType: EmitterType.APPENDIX1,
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name,
        recipientCompanySiret: company.siret,
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: company.siret
          }
        },
        grouping: {
          createMany: {
            data: [
              { initialFormId: appendix1_1.id, quantity: 0 },
              { initialFormId: appendix1_2.id, quantity: 0 },
              { initialFormId: appendix1_3.id, quantity: 0 }
            ]
          }
        }
      }
    });

    await cleanUnusedAppendix1ProducerBsdds();

    const grouping = await prisma.form
      .findUnique({ where: { id: container.id } })
      .grouping();
    expect(grouping?.length).toBe(3);
  });
});
