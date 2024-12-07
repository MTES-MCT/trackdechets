import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query } from "@td/codegen-back";
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
        form {
          id
          wasteDetails {
            code
          }
        }
        quantity
      }
    }
  }
`;

describe("groupedIn resolver", () => {
  afterAll(resetDatabase);

  it("should return an empty array if form is not grouped into another one", async () => {
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
    expect(data.form.groupedIn).toEqual([]);
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
        recipientCompanySiret: collectorCompany.siret,
        quantityReceived: 1
      }
    });

    const groupementForm = await formFactory({
      ownerId: collector.id,
      opt: {
        emitterCompanySiret: collectorCompany.siret,
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: appendix2.quantityReceived!.toNumber()
          }
        }
      }
    });

    const { query } = makeClient(collector);
    const { data } = await query<Pick<Query, "form">>(FORM, {
      variables: { id: appendix2.id }
    });
    expect(data.form.groupedIn).toEqual([
      expect.objectContaining({
        quantity: appendix2.quantityReceived?.toNumber(),
        form: {
          id: groupementForm.id,
          wasteDetails: { code: groupementForm.wasteDetailsCode }
        }
      })
    ]);
  });
});
