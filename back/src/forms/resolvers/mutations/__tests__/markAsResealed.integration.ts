import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";
import { ErrorCode } from "../../../../common/errors";

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

  it("should return an error when transporter is in a foreign country", async () => {
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

    const { errors } = await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {
          transporter: {
            isExemptedOfReceipt: true,
            department: "DE",
            company: {
              name: "German Transporter",
              contact: "Hermann Nitsch",
              mail: "h.nitsch@gmail.com",
              phone: "0606060606",
              country: "DE",
              address: "12 rue de Berlin"
            }
          }
        }
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Transporteur: Cette entreprise ne peut pas être à l'étranger"
    );
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });
});
