import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory,
  companyAssociatedToExistingUserFactory
} from "../../../../__tests__/factories";
import { webhookSettingFactory } from "../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Query } from "../../../../generated/graphql/types";
import { ErrorCode } from "../../../../common/errors";

import { gql } from "apollo-server-express";

const GET_WEBHOOK_SETTINGS = gql`
  query Webhooksettings {
    webhooksettings {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          createdAt
          endpointUri
          orgId
          activated
        }
      }
    }
  }
`;
describe("Query.webhookSettings", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();

    const { errors } = await query<Pick<Query, "webhooksettings">>(
      GET_WEBHOOK_SETTINGS
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should get webhook settings", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const secondCompany = await companyAssociatedToExistingUserFactory(
      user,
      "ADMIN"
    );
    const somebodyElseCompany = await companyFactory();
    const { query } = makeClient(user);

    const whs1 = await webhookSettingFactory({
      company,
      endpointUri: "https://lorem.ipsum"
    });

    const whs2 = await webhookSettingFactory({
      company: secondCompany,
      endpointUri: "https://lorem.ipsum"
    });

    await webhookSettingFactory({
      company: somebodyElseCompany,
      endpointUri: "https://lorem.ipsum"
    });

    const { data } = await query<Pick<Query, "webhooksettings">>(
      GET_WEBHOOK_SETTINGS
    );

    const ids = data.webhooksettings.edges.map(edge => edge.node.id);

    expect(ids.includes(whs1.id)).toBe(true);
    expect(ids.includes(whs2.id)).toBe(true);
    expect(data.webhooksettings.totalCount).toBe(2);
  });

  it("should return an empty array if there are no webhook settings", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "webhooksettings">>(
      GET_WEBHOOK_SETTINGS
    );

    expect(data.webhooksettings.totalCount).toBe(0);
  });
});
