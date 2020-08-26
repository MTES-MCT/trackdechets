import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";

const MARK_AS_RESEALED = `
  mutation MarkAsResealed($id: ID!, $resealedInfos: ResealedFormInput!){
    markAsResealed(id: $id, resealedInfos: $resealedInfos) {
      id
      status
    }
  }
`;

describe("Mutation markAsResealed", () => {
  afterEach(resetDatabase);

  test("the temp storer of the BSD can reseal it", async () => {
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

    await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {}
      }
    });

    const resealedForm = await prisma.form({ id: form.id });
    expect(resealedForm.status).toEqual("RESEALED");
  });
});
