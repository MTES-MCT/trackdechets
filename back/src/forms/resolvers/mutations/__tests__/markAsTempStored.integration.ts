import {
  userWithCompanyFactory,
  formFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";
import { ErrorCode } from "../../../../common/errors";

const MARK_AS_TEMP_STORED = `
  mutation MarkAsTempStored($id: ID!, $tempStoredInfos: TempStoredFormInput!){
    markAsTempStored(id: $id, tempStoredInfos: $tempStoredInfos){
      id
      status
    }
  }
`;

describe("{ mutation { markAsTempStored } }", () => {
  afterAll(() => resetDatabase());

  test("it fails when form is not SENT", async () => {
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

    const { errors } = await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
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
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        temporaryStorageDetail: { create: {} }
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    const formAfterMutation = await prisma.form({ id: form.id });

    expect(formAfterMutation.status).toEqual("TEMP_STORER_ACCEPTED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLogs({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "TEMP_STORER_ACCEPTED"
      }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("should leave the signature date empty when not provided", async () => {
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
    await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    const updatedTemporaryStorageDetail = await prisma
      .form({ id: form.id })
      .temporaryStorageDetail();
    expect(updatedTemporaryStorageDetail.tempStorerSignedAt).toBeNull();
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

    await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Thats isn't what I was expecting man !",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 0,
          quantityType: "REAL"
        }
      }
    });

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

  it("should not be possible to mark a BSD as temp stored if recipientIsTempStorage != true", async () => {
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
        recipientIsTempStorage: false,
        temporaryStorageDetail: { create: {} }
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Ce bordereau ne peut pas être marqué comme entreposé provisoirement car le destinataire " +
        "n'a pas été identifié comme étant une installation d'entreposage provisoire ou de reconditionnement"
    );
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });
});
