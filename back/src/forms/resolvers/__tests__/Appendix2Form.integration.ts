import { CompanyType, Status, UserRole } from "@prisma/client";
import type { Query } from "@td/codegen-back";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  companyFactory,
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";

const FORM = `
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
  }`;

describe("Appendix2Form", () => {
  afterAll(resetDatabase);

  it("should deny access to `emitter` field is user is not form contributor", async () => {
    const { user: emitterUser, company: emitter } =
      await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.PRODUCER] }
      });

    const collector = await companyFactory({
      companyTypes: { set: [CompanyType.COLLECTOR] }
    });

    const { user: destinationUser, company: destination } =
      await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      });

    const appendix2 = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        status: Status.AWAITING_GROUP,
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      }
    });

    const regroupement = await formFactory({
      ownerId: emitterUser.id,
      opt: {
        emitterType: "APPENDIX2",
        recipientCompanySiret: destination.siret,
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: appendix2.quantityReceived!
          }
        }
      }
    });

    // destination cannot access appendix2.emitter
    const { query } = makeClient(destinationUser);
    const { data } = await query<Pick<Query, "form">>(FORM, {
      variables: {
        id: regroupement.id
      }
    });
    expect(data.form.appendix2Forms![0]).toMatchObject({ emitter: null });
  });
});
