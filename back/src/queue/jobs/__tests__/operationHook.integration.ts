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
import getReadableId from "../../../forms/readableId";

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

  it("updates final operations for two temporary storages with a final operation code", async () => {
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      UserRole.MEMBER,
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );

    // original BSDD with forwarded
    const { id, forwardedInId } = await formWithTempStorageFactory({
      ownerId: ttrUser.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        wasteDetailsCode: "05 01 02*",
        status: Status.TEMP_STORER_ACCEPTED,
        quantityReceived: 1000,
        createdAt: new Date("2021-04-01"),
        sentAt: new Date("2021-04-01"),
        receivedAt: new Date("2021-04-01"),
        processedAt: new Date("2021-04-01"),
        processingOperationDone: "D 13",
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

    // Manually execute operationHook to simulate the chain
    await operationHook({
      finalFormId: id,
      initialFormId: id
    });
    await operationHook({
      finalFormId: id,
      initialFormId: forwardedInId!
    });
    await operationHook({
      finalFormId: forwardedInId!,
      initialFormId: forwardedInId!
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id },
      include: { finalOperations: true, forwardedIn: true }
    });
    // the original form has 1 final operation of the forwardedInId
    expect(updatedForm.finalOperations.length).toStrictEqual(1);
    expect(updatedForm?.finalOperations[0]).toMatchObject({
      formId: updatedForm.id,
      finalBsdReadableId: updatedForm.forwardedIn!.readableId,
      quantity: updatedForm.forwardedIn!.quantityReceived!,
      operationCode: updatedForm.forwardedIn!.processingOperationDone!,
      destinationCompanySiret: updatedForm.forwardedIn!.recipientCompanySiret!,
      destinationCompanyName: updatedForm.forwardedIn!.recipientCompanyName!
    });
    // change to D 13 and forward another time from formWithTempStorage.forwardedInId
    const forwardedInBis = await prisma.form.update({
      where: { id: forwardedInId! },
      include: { forwardedIn: true },
      data: {
        processingOperationDone: "D 13",
        forwardedIn: {
          create: {
            emitterCompanySiret: ttr.siret,
            emitterCompanyName: ttr.name,
            recipientCompanySiret: destination.company.siret,
            recipientCompanyName: destination.company.name,
            quantityReceived: 100,
            receivedAt: new Date(),
            processingOperationDone: "R 1",
            ownerId: ttrUser.id,
            readableId: getReadableId()
          }
        }
      }
    });
    // Manually execute all possible operationHooks to simulate the chain
    await operationHook({
      finalFormId: id,
      initialFormId: id
    });
    await operationHook({
      finalFormId: id,
      initialFormId: forwardedInId!
    });
    await operationHook({
      finalFormId: forwardedInId!,
      initialFormId: id
    });
    await operationHook({
      finalFormId: id,
      initialFormId: forwardedInBis.forwardedInId!
    });
    await operationHook({
      finalFormId: forwardedInBis.forwardedInId!,
      initialFormId: id
    });
    await operationHook({
      finalFormId: forwardedInId!,
      initialFormId: forwardedInId!
    });
    await operationHook({
      finalFormId: forwardedInId!,
      initialFormId: forwardedInBis.forwardedInId!
    });
    await operationHook({
      finalFormId: forwardedInBis.forwardedInId!,
      initialFormId: forwardedInId!
    });
    await operationHook({
      finalFormId: forwardedInBis.forwardedInId!,
      initialFormId: forwardedInBis.forwardedInId!
    });

    const level2Form = await prisma.form.findUniqueOrThrow({
      where: { id: forwardedInId! },
      include: { finalOperations: true, forwardedIn: true }
    });

    // the intermediary BSD has 1 final operation of the level2Form.forwardedIn.id
    expect(level2Form.finalOperations.length).toStrictEqual(1);
    expect(level2Form?.finalOperations[0]).toMatchObject({
      formId: level2Form.id,
      finalBsdReadableId: level2Form.forwardedIn!.readableId,
      quantity: level2Form.forwardedIn!.quantityReceived!,
      operationCode: level2Form.forwardedIn!.processingOperationDone!,
      destinationCompanySiret: level2Form.forwardedIn!.recipientCompanySiret!,
      destinationCompanyName: level2Form.forwardedIn!.recipientCompanyName!
    });

    // The original BSD has 1 final operation of the level2Form.forwardedIn
    const formWithTempStorage = await prisma.form.findUniqueOrThrow({
      where: { id },
      include: { finalOperations: true, forwardedIn: true }
    });
    expect(formWithTempStorage.finalOperations?.length).toStrictEqual(1);
    expect(formWithTempStorage.finalOperations[0]).toMatchObject({
      formId: formWithTempStorage.id,
      finalBsdReadableId: level2Form.forwardedIn!.readableId,
      quantity: level2Form.forwardedIn!.quantityReceived!,
      operationCode: level2Form.forwardedIn!.processingOperationDone!,
      destinationCompanySiret: level2Form.forwardedIn!.recipientCompanySiret!,
      destinationCompanyName: level2Form.forwardedIn!.recipientCompanyName!
    });
  });

  it("updates final operations for temporary storage of 1 level with a final operation code only at the end", async () => {
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      UserRole.MEMBER,
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );

    // original BSDD with forwarded
    const { id, forwardedInId } = await formWithTempStorageFactory({
      ownerId: ttrUser.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        wasteDetailsCode: "05 01 02*",
        status: Status.TEMP_STORER_ACCEPTED,
        quantityReceived: 1000,
        createdAt: new Date("2021-04-01"),
        sentAt: new Date("2021-04-01"),
        receivedAt: new Date("2021-04-01"),
        processedAt: new Date("2021-04-01"),
        processingOperationDone: "D 13",
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

    // Manually execute operationHook to simulate the chain
    await operationHook({
      finalFormId: id,
      initialFormId: id
    });
    await operationHook({
      finalFormId: forwardedInId!,
      initialFormId: id
    });
    await operationHook({
      finalFormId: id,
      initialFormId: forwardedInId!
    });
    await operationHook({
      finalFormId: forwardedInId!,
      initialFormId: forwardedInId!
    });

    const forwardedInForm = await prisma.form.findUniqueOrThrow({
      where: { id: forwardedInId! },
      include: { finalOperations: true, forwardedIn: true }
    });

    // the in-between BSD has 0 final operation
    expect(forwardedInForm.finalOperations.length).toStrictEqual(0);

    // The original BSD has 2 final operations
    const formWithTempStorage = await prisma.form.findUniqueOrThrow({
      where: { id },
      include: { finalOperations: true, forwardedIn: true }
    });

    expect(formWithTempStorage.finalOperations?.length).toStrictEqual(1);
    expect(formWithTempStorage.finalOperations[0]).toMatchObject({
      formId: formWithTempStorage.id,
      finalBsdReadableId: forwardedInForm.readableId,
      quantity: forwardedInForm.quantityReceived,
      operationCode: forwardedInForm.processingOperationDone,
      destinationCompanySiret: forwardedInForm.recipientCompanySiret!,
      destinationCompanyName: forwardedInForm.recipientCompanyName!
    });
  });

  it("updates final operations for noTraceability = true", async () => {
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
        status: Status.ACCEPTED,
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
        processingOperationDone: "D 13",
        // TRUE
        noTraceability: true
      }
    });

    expect(formWithTempStorage.forwardedIn).toBeDefined();
    // Manually execute operationHook to simulate markAsProcessed
    await operationHook({
      finalFormId: formWithTempStorage.forwardedIn!.id,
      initialFormId: formWithTempStorage.forwardedIn!.id
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: formWithTempStorage.id },
      include: { finalOperations: true, forwardedIn: true }
    });

    expect(updatedForm?.finalOperations[0]).toMatchObject({
      destinationCompanyName: "Incinérateur du Grand Est",
      destinationCompanySiret: destination.siret,
      finalBsdReadableId: formWithTempStorage.forwardedIn!.readableId,
      operationCode: "D 13",
      quantity: 100
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
        quantityGrouped: 99,
        processingOperationDone: "D 13"
      }
    });
    const appendix2Bis = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        emitterCompanyAddress: "40 boulevard Voltaire 13001 Marseille",
        recipientCompanySiret: collectorCompany.siret,
        quantityReceived: 30,
        quantityGrouped: 29,
        processingOperationDone: "D 13"
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
          createMany: {
            data: [
              {
                initialFormId: appendix2.id,
                quantity: 10
              },
              {
                initialFormId: appendix2Bis.id,
                quantity: 20
              }
            ]
          }
        }
      }
    });

    // Manually execute operationHook to simulate nothing happens
    await operationHook({
      finalFormId: appendix2.id,
      initialFormId: appendix2.id
    });
    await operationHook({
      finalFormId: appendix2Bis.id,
      initialFormId: appendix2Bis.id
    });

    const notUpdatedInitialForm = await prisma.form.findUniqueOrThrow({
      where: { id: regroupementForm.id },
      include: { finalOperations: true }
    });

    expect(notUpdatedInitialForm.finalOperations.length).toStrictEqual(0);

    // Manually execute operationHook to simulate the good process
    await operationHook({
      finalFormId: regroupementForm.id,
      initialFormId: regroupementForm.id
    });

    const updatedRegroupementForm = await prisma.form.findUniqueOrThrow({
      where: { id: regroupementForm.id },
      include: { grouping: true }
    });

    const updatedInitialForm = await prisma.form.findUniqueOrThrow({
      where: { id: appendix2.id },
      include: { finalOperations: true }
    });
    const groupedInitialForm1 = updatedRegroupementForm.grouping.find(
      group => group.initialFormId === appendix2.id
    );
    const groupedInitialForm2 = updatedRegroupementForm.grouping.find(
      group => group.initialFormId === appendix2Bis.id
    );

    expect(updatedInitialForm.finalOperations.length).toStrictEqual(1);

    expect(updatedInitialForm.finalOperations[0]).toMatchObject({
      formId: updatedInitialForm.id,
      finalBsdReadableId: updatedRegroupementForm!.readableId,
      quantity: groupedInitialForm1!.quantity!,
      operationCode: updatedRegroupementForm.processingOperationDone!,
      destinationCompanySiret: updatedRegroupementForm.recipientCompanySiret!,
      destinationCompanyName: updatedRegroupementForm.recipientCompanyName!
    });

    const updatedInitialFormBis = await prisma.form.findUniqueOrThrow({
      where: { id: appendix2Bis.id },
      include: { finalOperations: true }
    });
    expect(updatedInitialFormBis.finalOperations[0]).toMatchObject({
      formId: updatedInitialFormBis.id,
      finalBsdReadableId: updatedRegroupementForm!.readableId,
      quantity: groupedInitialForm2!.quantity!,
      operationCode: updatedRegroupementForm.processingOperationDone!,
      destinationCompanySiret: updatedRegroupementForm.recipientCompanySiret!,
      destinationCompanyName: updatedRegroupementForm.recipientCompanyName!
    });
  });
});
