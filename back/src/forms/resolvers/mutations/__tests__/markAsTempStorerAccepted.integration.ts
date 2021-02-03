import {
  userWithCompanyFactory,
  formFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";

const MARK_AS_TEMP_STORER_ACCEPTED = `
    mutation MarkAsTempStorerAccepted($id: ID!, $tempStorerAcceptedInfo: TempStorerAcceptedFormInput!){
      markAsTempStorerAccepted(id: $id, tempStorerAcceptedInfo: $tempStorerAcceptedInfo){
        id
        status
      }
    }
  `;

describe("{ mutation { markAsTempStorerAccepted } }", () => {
  afterAll(() => resetDatabase());

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
});
