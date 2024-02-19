import { resetDatabase } from "../../../../integration-tests/helper";
import { operationHook } from "../operationHook";
import { UserRole, CompanyType, Status, Company, User } from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  userWithCompanyFactory,
  companyFactory,
  formWithTempStorageFactory,
  formFactory
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

  it("updates final operations of an appendix2", async () => {
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory(UserRole.MEMBER);

    const { user: collector, company: collectorCompany } =
      await userWithCompanyFactory(UserRole.MEMBER);

    const { user: _ttrUser, company: ttr } = await userWithCompanyFactory(
      UserRole.MEMBER,
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );
    const appendix2 = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        emitterCompanyAddress: "40 boulevard Voltaire 13001 Marseille",
        recipientCompanySiret: collectorCompany.siret,
        quantityReceived: 100,
        processingOperationDone: "R 1",
      }
    });

    const regroupementForm = await formFactory({
      ownerId: collector.id,
      opt: {
        emitterCompanySiret: collectorCompany.siret,
        recipientCompanySiret: ttr.siret,
        emitterType: "APPENDIX2",
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
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: 10
          }
        }
      }
    });
    // Manually execute operationHook to simulate nothing happens
    await operationHook({
      operationId: appendix2.id,
      formId: appendix2.id
    });

    const notUpdatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: regroupementForm.id },
      include: { finalOperations: true, grouping: true }
    });

    expect(notUpdatedForm.finalOperations.length).toStrictEqual(0)

    // Manually execute operationHook to simulate markAsProcessed
    await operationHook({
      operationId: regroupementForm.id,
      formId: regroupementForm.id
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: regroupementForm.id },
      include: { finalOperations: true, grouping: true }
    });
    const groupedInitialForm = updatedForm.grouping.find(group => group.initialFormId === appendix2.id);
    expect(updatedForm.finalOperations.length).toStrictEqual(1)

    expect(updatedForm.finalOperations[0]).toMatchObject({
      formId: updatedForm.id,
      finalBsdReadableId: groupedInitialForm!.initialFormId,
      quantity: groupedInitialForm!.quantity!,
      operationCode: appendix2.processingOperationDone!,
      destinationCompanySiret: appendix2.recipientCompanySiret!,
      destinationCompanyName: appendix2.recipientCompanyName!
    });
  });
});
