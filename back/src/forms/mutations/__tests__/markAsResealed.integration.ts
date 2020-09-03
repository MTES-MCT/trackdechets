import {
  userWithCompanyFactory,
  formWithTempStorageFactory,
  companyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { resetDatabase } from "../../../../integration-tests/helper";

const MARK_AS_RESEALED = `
  mutation MarkAsResealed($id: ID!, $resealedInfos: ResealedFormInput!) {
    markAsResealed(id: $id, resealedInfos: $resealedInfos) {
      id
    }
  }
`;

describe("Mutation.markAsResealed", () => {
  afterAll(() => resetDatabase());

  it("should return an error when transporter is in a foreign country", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const recipientCompany = await companyFactory();
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "SEALED"
      }
    });

    const { mutate } = makeClient(user);
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

    expect(errors).toEqual([
      expect.objectContaining({
        message: [
          "Transporteur: La sélection d'une entreprise par SIRET est obligatoire",
          "Transporteur: Cette entreprise ne peut pas être à l'étranger"
        ].join("\n")
      })
    ]);
  });
});
