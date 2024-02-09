import { resetDatabase } from "../../../../integration-tests/helper";
import { operationHook } from "../operationHook";
import { UserRole, CompanyType, Status, Company, User } from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  userWithCompanyFactory,
  companyFactory,
  formWithTempStorageFactory
} from "../../../__tests__/factories";

describe("Test Form OperationHook job", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };

  afterEach(resetDatabase);
  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: [CompanyType.PRODUCER]
      }
    });

    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: [CompanyType.TRANSPORTER]
      }
    });

    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    });
  });

  it("updates final operations for final operation code", async () => {
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      UserRole.MEMBER,
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );

    const formWithTempStorage = await formWithTempStorageFactory({
      ownerId: ttrUser.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        wasteDetailsCode: "05 01 02*",
        status: Status.PROCESSED,
        quantityReceived: 1000,
        createdAt: new Date("2021-04-01"),
        sentAt: new Date("2021-04-01"),
        receivedAt: new Date("2021-04-01"),
        processedAt: new Date("2021-04-01"),
        processingOperationDone: "R 1",
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            number: 1
          }
        },
        recipientCompanySiret: ttr.siret
      },
      forwardedInOpts: {
        emitterCompanySiret: ttr.siret,
        emitterCompanyName: ttr.name,
        recipientCompanySiret: destination.company.siret,
        quantityReceived: 100,
        receivedAt: new Date(),
        processingOperationDone: "R 1"
      }
    });

    expect(formWithTempStorage.forwardedIn).toBeDefined();
    // Manually execute operationHook to simulate markAsProcessed
    await operationHook({
      operationId: formWithTempStorage.forwardedIn!.id,
      formId: formWithTempStorage.forwardedIn!.id
    });
    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: formWithTempStorage.id },
      include: { finalOperations: true, forwardedIn: true }
    });

    expect(updatedForm?.finalOperations[0]).toMatchObject({
      formId: updatedForm.id,
      finalBsdReadableId: updatedForm.forwardedIn!.readableId,
      quantity: updatedForm.forwardedIn!.quantityReceived!,
      operationCode: updatedForm.forwardedIn!.processingOperationDone!,
      destinationCompanySiret: updatedForm.forwardedIn!.recipientCompanySiret!,
      destinationCompanyName: updatedForm.forwardedIn!.recipientCompanyName!
    });
  });

  it("updates final operations for noTraceability", async () => {
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      UserRole.MEMBER,
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );
    const destination = await companyFactory({
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
    });

    const formWithTempStorage = await formWithTempStorageFactory({
      ownerId: ttrUser.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        wasteDetailsCode: "05 01 02*",
        status: Status.PROCESSED,
        quantityReceived: 1000,
        createdAt: new Date("2021-04-01"),
        sentAt: new Date("2021-04-01"),
        receivedAt: new Date("2021-04-01"),
        processedAt: new Date("2021-04-01"),
        processingOperationDone: "R 1",
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            number: 1
          }
        },
        recipientCompanySiret: ttr.siret
      },
      forwardedInOpts: {
        emitterCompanySiret: ttr.siret,
        emitterCompanyName: ttr.name,
        recipientCompanySiret: destination.siret,
        quantityReceived: 100,
        receivedAt: new Date(),
        processingOperationDone: "NOT_APPLICABLE",
        noTraceability: true
      }
    });

    expect(formWithTempStorage.forwardedIn).toBeDefined();
    // Manually execute operationHook to simulate markAsProcessed
    await operationHook({
      operationId: formWithTempStorage.forwardedIn!.id,
      formId: formWithTempStorage.forwardedIn!.id
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: formWithTempStorage.id },
      include: { finalOperations: true, forwardedIn: true }
    });

    expect(updatedForm?.finalOperations[0]).toMatchObject({
      formId: updatedForm.id,
      finalBsdReadableId: updatedForm.forwardedIn!.readableId,
      quantity: updatedForm.forwardedIn!.quantityReceived!,
      operationCode: updatedForm.forwardedIn!.processingOperationDone!,
      destinationCompanySiret: updatedForm.forwardedIn!.recipientCompanySiret!,
      destinationCompanyName: updatedForm.forwardedIn!.recipientCompanyName!
    });
  });
});
