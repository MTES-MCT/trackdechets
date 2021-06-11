import { CompanyType, Status, UserRole } from ".prisma/client";
import { gql } from "apollo-server-express";
import { Appendix2Form } from "../../../generated/graphql/types";
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
        readableId
        wasteDetails {
          code
          quantity
          quantityType
        }
        emitter {
          company {
            siret
            name
          }
        }
        emitterPostalCode
        signedAt
        quantityReceived
        processingOperationDone
      }
    }
  }
`;

describe("Appendix2Form", () => {
  it("should return initial form information info", async () => {
    const {
      user: emitterUser,
      company: emitter
    } = await userWithCompanyFactory(UserRole.MEMBER, {
      companyTypes: { set: [CompanyType.PRODUCER] }
    });

    const {
      user: collectorUser,
      company: collector
    } = await userWithCompanyFactory(UserRole.MEMBER, {
      companyTypes: { set: [CompanyType.COLLECTOR] }
    });

    const appendix2 = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        status: Status.AWAITING_GROUP,
        emitterCompanySiret: emitter.siret,
        emitterCompanyAddress: "40 boulevard Voltaire 13001 Marseille",
        recipientCompanySiret: collector.siret,
        processingOperationDone: "R 12",
        signedAt: new Date()
      }
    });

    const regroupement = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        emitterCompanySiret: collector.siret,
        appendix2Forms: { connect: { id: appendix2.id } }
      }
    });

    const { query } = makeClient(collectorUser);
    const { data } = await query<{ form: { appendix2Forms: [Appendix2Form] } }>(
      FORM,
      {
        variables: { id: regroupement.id }
      }
    );

    const appendix2Result = data?.form.appendix2Forms[0];

    expect(appendix2Result.wasteDetails.code).toEqual(
      appendix2.wasteDetailsCode
    );
    expect(appendix2Result.wasteDetails.quantity).toEqual(
      appendix2.wasteDetailsQuantity
    );
    expect(appendix2Result.wasteDetails.quantityType).toEqual(
      appendix2.wasteDetailsQuantityType
    );
    expect(appendix2Result.emitter.company.siret).toEqual(
      appendix2.emitterCompanySiret
    );
    expect(appendix2Result.emitter.company.name).toEqual(
      appendix2.emitterCompanyName
    );
    expect(appendix2Result.emitterPostalCode).toEqual("13001");
    expect(appendix2Result.signedAt).toEqual(appendix2.signedAt.toISOString());
    expect(appendix2Result.quantityReceived).toEqual(
      appendix2.quantityReceived
    );
    expect(appendix2Result.processingOperationDone).toEqual(
      appendix2.processingOperationDone
    );
  });

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
