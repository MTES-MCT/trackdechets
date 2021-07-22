import { resetDatabase } from "../../../../../integration-tests/helper";
import { bsdasriFactory } from "../../../__tests__/factories";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";

import { Mutation } from "../../../../generated/graphql/types";

const UPDATE_DASRI = `
mutation UpdateDasri($id: ID!, $input: BsdasriUpdateInput!) {
  updateBsdasri(id: $id, input: $input) {
    id
    status
    bsdasriType
    emitter {
       company {
          mail
        }
      }
    regroupedBsdasris
  }
}`;
describe("Mutation.updateBsdasri", () => {
  afterEach(resetDatabase);

  it("should set dasri type to GROUPING when regrouping", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const toRegroup = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        recipientCompanySiret: company.siret,
        processingOperation: "R1"
      }
    });
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.INITIAL,
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { regroupedBsdasris: [{ id: toRegroup.id }] }
        }
      }
    );
    expect(data.updateBsdasri.regroupedBsdasris).toEqual([toRegroup.id]);
    expect(data.updateBsdasri.bsdasriType).toEqual("GROUPING");
  });

  it("should set dasri type to SIMPLE when ungrouping", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });

    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        status: BsdasriStatus.INITIAL,
        emitterCompanySiret: company.siret,
        bsdasriType: "GROUPING"
      }
    });

    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { regroupedBsdasris: null }
        }
      }
    );
    expect(data.updateBsdasri.regroupedBsdasris).toEqual([]);
    expect(data.updateBsdasri.bsdasriType).toEqual("SIMPLE");
  });
});
