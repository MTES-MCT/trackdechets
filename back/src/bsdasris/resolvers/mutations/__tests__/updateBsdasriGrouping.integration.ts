import { resetDatabase } from "../../../../../integration-tests/helper";
import { bsdasriFactory } from "../../../__tests__/factories";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";

import { Mutation } from "../../../../generated/graphql/types";

const UPDATE_DASRI = `
mutation UpdateDasri($id: ID!, $input: BsdasriInput!) {
  updateBsdasri(id: $id, input: $input) {
    id
    status
    type
    emitter {
       company {
          mail
        }
      }
      grouping { id }
  }
}`;
describe("Mutation.updateBsdasri", () => {
  afterEach(resetDatabase);

  it("should set dasri type to GROUPING when grouping", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const toRegroup = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.PROCESSED,
        emitterCompanySiret: "1234",
        destinationCompanySiret: company.siret,
        destinationOperationCode: "R1"
      }
    });
    const dasri = await bsdasriFactory({
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
          input: { grouping: [toRegroup.id] }
        }
      }
    );

    expect(data.updateBsdasri.grouping).toEqual([{ id: toRegroup.id }]);
    expect(data.updateBsdasri.type).toEqual("GROUPING");
  });

  it("should set dasri type to SIMPLE when ungrouping", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });

    const dasri = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.INITIAL,
        emitterCompanySiret: company.siret,
        type: "GROUPING"
      }
    });

    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { grouping: null }
        }
      }
    );
    expect(data.updateBsdasri.grouping).toEqual([]);
    expect(data.updateBsdasri.type).toEqual("SIMPLE");
  });
});
