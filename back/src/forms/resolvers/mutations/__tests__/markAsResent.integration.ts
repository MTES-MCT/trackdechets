import { resetDatabase } from "integration-tests/helper";
import prisma from "src/prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const MARK_AS_RESENT = `
  mutation MarkAsResent($id: ID!, $resentInfos: ResentFormInput!){
    markAsResent(id: $id, resentInfos: $resentInfos) {
      id
      status
    }
  }
`;

describe("Mutation markAsResent", () => {
  afterEach(resetDatabase);

  test("it fails when form is not TEMP_STORER_ACCEPTED", async () => {
    const owner = await userFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "DRAFT",
        recipientCompanySiret: company.siret
      }
    });

    const { errors } = await mutate(MARK_AS_RESENT, {
      variables: {
        id: form.id,
        resentInfos: {
          signedAt: "2020-01-01T00:00:00.000Z",
          signedBy: "John Snow"
        }
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });

  test("the temp storer of the BSD can resend it", async () => {
    const owner = await userFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: company.siret
      }
    });

    await mutate(MARK_AS_RESENT, {
      variables: {
        id: form.id,
        resentInfos: {
          signedAt: "2020-01-01T00:00:00.000Z",
          signedBy: "John Snow"
        }
      }
    });

    const resealedForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resealedForm.status).toEqual("RESENT");
  });

  test("it should fail if temporary storage detail is incomplete", async () => {
    const owner = await userFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: company.siret
      }
    });

    // assume destination siret missing
    await prisma.form.update({
      where: { id: form.id },
      data: {
        temporaryStorageDetail: { update: { destinationCompanySiret: "" } }
      }
    });

    const { errors } = await mutate(MARK_AS_RESENT, {
      variables: {
        id: form.id,
        resentInfos: {
          signedAt: "2020-01-01T00:00:00.000Z",
          signedBy: "John Snow"
        }
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Destination prévue: Le siret de l'entreprise est obligatoire"
    );
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    const resealedForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resealedForm.status).toEqual("TEMP_STORER_ACCEPTED");
  });

  test("it should work if resentInfos is completing current data", async () => {
    const owner = await userFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: company.siret
      }
    });

    // assume destination siret is missing
    await prisma.form.update({
      where: { id: form.id },
      data: {
        temporaryStorageDetail: { update: { destinationCompanySiret: "" } }
      }
    });

    // provide missing info in resentInfos
    await mutate(MARK_AS_RESENT, {
      variables: {
        id: form.id,
        resentInfos: {
          signedAt: "2020-01-01T00:00:00.000Z",
          signedBy: "John Snow",
          destination: {
            company: {
              siret: "12658974589563"
            }
          }
        }
      }
    });

    const resealedForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resealedForm.status).toEqual("RESENT");
  });
});
