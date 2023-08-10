import { UserRole } from "@prisma/client";
import gql from 'graphql-tag';
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
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

  it("should get a bsda by id if current user is an intermediary", async () => {
    const otherCompany = await companyFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret,
        intermediaries: {
          create: [
            { siret: company.siret!, name: company.name, contact: "joe" }
          ]
        }
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bsda">>(GET_BSDA, {
      variables: { id: bsda.id }
    });
    expect(data.bsda.id).toBe(bsda.id);
  });
});
