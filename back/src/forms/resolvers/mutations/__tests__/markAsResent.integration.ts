import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";

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

  test("the temp storer of the BSD can resend it", async () => {
    const owner = await userFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORED",
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

    const resealedForm = await prisma.form({ id: form.id });
    expect(resealedForm.status).toEqual("RESENT");
  });
});
