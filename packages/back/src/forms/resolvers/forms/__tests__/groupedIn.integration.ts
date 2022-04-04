import { UserRole } from "@prisma/client";
import { gql } from "apollo-server-express";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "@trackdechets/codegen/src/back.gen";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const FORM = gql`
  query Form($id: ID, $readableId: String) {
    form(id: $id, readableId: $readableId) {
      id
      groupedIn {
        id
        wasteDetails {
          code
        }
      }
    }
  }
`;

describe("groupedIn resolver", () => {
  afterAll(resetDatabase);

  it("should return null if form is not grouped into another one", async () => {
    const { user, company: emitter } = await userWithCompanyFactory(
      UserRole.MEMBER
    );
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: emitter.siret }
    });
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "form">>(FORM, {
      variables: { id: form.id }
    });
    expect(data.form.groupedIn).toEqual(null);
  });

  it("should return form this one is grouped into", async () => {
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory(UserRole.MEMBER);

    const { user: collector, company: collectorCompany } =
      await userWithCompanyFactory(UserRole.MEMBER);

    const appendix2 = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        emitterCompanyAddress: "40 boulevard Voltaire 13001 Marseille",
        recipientCompanySiret: collectorCompany.siret
      }
    });

    const groupementForm = await formFactory({
      ownerId: collector.id,
      opt: {
        emitterCompanySiret: collectorCompany.siret,
        appendix2Forms: { connect: { id: appendix2.id } }
      }
    });

    const { query } = makeClient(collector);
    const { data } = await query<Pick<Query, "form">>(FORM, {
      variables: { id: appendix2.id }
    });
    expect(data.form.groupedIn).toEqual(
      expect.objectContaining({
        id: groupementForm.id,
        wasteDetails: { code: groupementForm.wasteDetailsCode }
      })
    );
  });
});
