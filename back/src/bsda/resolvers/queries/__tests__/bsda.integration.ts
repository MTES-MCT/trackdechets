import { UserRole } from "@prisma/client";
import { gql } from "apollo-server-express";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { fullBsda } from "../../../fragments";
import { bsdaFactory } from "../../../__tests__/factories";

const GET_BSDA = gql`
  query GetBsda($id: ID!) {
    bsda(id: $id) {
      ...FullBsda
    }
  }
  ${fullBsda}
`;

describe("Query.Bsda", () => {
  afterEach(resetDatabase);

  it("should get a bsda by id", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const form = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsda">>(GET_BSDA, {
      variables: { id: form.id }
    });

    expect(data.bsda.id).toBe(form.id);
  });
});
