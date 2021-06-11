import { CompanyType, Status, UserRole } from ".prisma/client";
import { gql } from "apollo-server-express";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";

const FORM = gql`
  query Form($id: ID!) {
    form(id: $id) {
      appendix2Forms {
        id
        emitter {
          company {
            name
          }
        }
      }
    }
  }
`;

describe("Appendix2Form", () => {
  it("should deny access to `emitter` field is user is not form contributor", async () => {
    const {
      user: emitterUser,
      company: emitter
    } = await userWithCompanyFactory(UserRole.MEMBER, {
      companyTypes: { set: [CompanyType.PRODUCER] }
    });

    const collector = await companyFactory({
      companyTypes: { set: [CompanyType.COLLECTOR] }
    });

    const {
      user: destinationUser,
      company: destination
    } = await userWithCompanyFactory(UserRole.MEMBER, {
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
    });

    const appendix2 = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        status: Status.AWAITING_GROUP,
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: collector.siret
      }
    });

    const regroupement = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        appendix2Forms: { connect: { id: appendix2.id } },
        recipientCompanySiret: destination.siret
      }
    });

    // destination cannot access appendix2.emitter
    const { query } = makeClient(destinationUser);
    const { errors } = await query(FORM, {
      variables: { id: regroupement.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas accéder au champ `emitter` de cette annexe 2 car votre SIRET apparait uniquement sur le bordereau de regroupement"
      })
    ]);
  });
});
