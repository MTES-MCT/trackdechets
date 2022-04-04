import { format } from "date-fns";
import {
  userWithCompanyFactory,
  formFactory,
  companyFactory,
  formWithTempStorageFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { allowedFormats } from "../../../../common/dates";
import {
  CompanyType,
  Status,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import {
  Mutation,
  MutationMarkAsTempStorerAcceptedArgs
} from "@trackdechets/codegen/src/back.gen";

const MARK_AS_TEMP_STORER_ACCEPTED = `
    mutation MarkAsTempStorerAccepted($id: ID!, $tempStorerAcceptedInfo: TempStorerAcceptedFormInput!){
      markAsTempStorerAccepted(id: $id, tempStorerAcceptedInfo: $tempStorerAcceptedInfo){
        id
        status
      }
    }
  `;

describe("{ mutation { markAsTempStorerAccepted } }", () => {
  afterEach(() => resetDatabase());

  test("it fails when form is not TEMP_STORED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        temporaryStorageDetail: { create: {} }
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: form.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          signedAt: "2018-12-11T00:00:00.000Z",
          signedBy: "John Doe",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });

  test("the temp storer of the BSD can mark it as TEMP_STORER_ACCEPTED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "TEMP_STORED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        temporaryStorageDetail: { create: {} },
        receivedBy: "John Doe",
        receivedAt: "2018-12-11T00:00:00.000Z"
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: form.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          signedAt: "2018-12-11T00:00:00.000Z",
          signedBy: "John Doe",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    const formAfterMutation = await prisma.form.findUnique({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("TEMP_STORER_ACCEPTED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "TEMP_STORER_ACCEPTED"
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
        status: "TEMP_STORED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        temporaryStorageDetail: { create: {} },
        receivedBy: "John Doe",
        receivedAt: "2018-12-11T00:00:00.000Z"
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: form.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Thats isn't what I was expecting man !",
          signedBy: "John Doe",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 0,
          quantityType: "REAL"
        }
      }
    });

    const formAfterMutation = await prisma.form.findUnique({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("REFUSED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "REFUSED"
      }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test.each(allowedFormats)("%p is a valid format for signedAt", async f => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.TEMP_STORED,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        temporaryStorageDetail: { create: {} },
        receivedBy: "John Doe",
        receivedAt: "2018-12-11T00:00:00.000Z"
      }
    });

    const { mutate } = makeClient(user);

    const signedAt = new Date("2018-12-11");

    await mutate(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: form.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
          wasteRefusalReason: "",
          signedAt: format(signedAt, f),
          signedBy: "John Doe",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    const formAfterMutation = await prisma.form.findUnique({
      where: { id: form.id }
    });

    const tempStorage = await prisma.form
      .findUnique({
        where: { id: form.id }
      })
      .temporaryStorageDetail();

    expect(formAfterMutation.status).toEqual(Status.TEMP_STORER_ACCEPTED);
    expect(tempStorage.tempStorerSignedAt).toEqual(signedAt);
  });

  it("should unlink appendix 2 in case of refusal", async () => {
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      UserRole.MEMBER,
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );
    const { user: destinationUser, company: destination } =
      await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      });

    const form1 = await formFactory({
      ownerId: ttrUser.id,
      opt: {
        status: "GROUPED",
        processingOperationDone: "R 13",
        recipientCompanySiret: ttr.siret
      }
    });

    const form2 = await formFactory({
      ownerId: ttrUser.id,
      opt: {
        status: "GROUPED",
        processingOperationDone: "R 13",
        recipientCompanySiret: ttr.siret
      }
    });

    const groupementForm = await formWithTempStorageFactory({
      ownerId: ttrUser.id,
      opt: {
        emitterType: "APPENDIX2",
        emitterCompanySiret: ttr.siret,
        status: Status.TEMP_STORED,
        receivedBy: "Bill",
        recipientCompanySiret: destination.siret,
        receivedAt: new Date("2019-01-17"),
        appendix2Forms: { connect: [{ id: form1.id }, { id: form2.id }] }
      }
    });

    const { mutate } = makeClient(destinationUser);

    await mutate<
      Pick<Mutation, "markAsReceived">,
      MutationMarkAsTempStorerAcceptedArgs
    >(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: groupementForm.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Parce que",
          signedAt: "2019-01-18" as any,
          signedBy: "John",
          quantityType: "REAL",
          quantityReceived: 0
        }
      }
    });

    const updatedForm1 = await prisma.form.findUnique({
      where: { id: form1.id }
    });
    const updatedForm2 = await prisma.form.findUnique({
      where: { id: form2.id }
    });
    expect(updatedForm1.status).toEqual("AWAITING_GROUP");
    expect(updatedForm2.status).toEqual("AWAITING_GROUP");

    const appendix2Forms = await prisma.form
      .findUnique({
        where: { id: groupementForm.id }
      })
      .appendix2Forms();
    expect(appendix2Forms).toEqual([]);
  });
});
