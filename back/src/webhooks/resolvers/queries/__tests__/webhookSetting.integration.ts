import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import { webhookSettingFactory } from "../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Query } from "@td/codegen-back";
import { ErrorCode } from "../../../../common/errors";

import { gql } from "graphql-tag";

const GET_WEBHOOK_SETTING = gql`
  query Webhooksetting($id: ID!) {
    webhooksetting(id: $id) {
      id
      createdAt
      endpointUri
      orgId
      activated
    }
  }
`;

describe("Query.webhookSetting", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const company = await companyFactory();
    const whs = await webhookSettingFactory({
      company,
      endpointUri: "https://lorem.ipsum"
    });

    const { query } = makeClient();

    const { errors } = await query<Pick<Query, "webhooksetting">>(
      GET_WEBHOOK_SETTING,
      { variables: { id: whs.id } }
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

  it("should get a webhook setting by id", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const whs = await webhookSettingFactory({
      company,
      endpointUri: "https://lorem.ipsum"
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "webhooksetting">>(
      GET_WEBHOOK_SETTING,
      { variables: { id: whs.id } }
    );
    expect(data.webhooksetting.id).toBe(whs.id);
    expect(data.webhooksetting.endpointUri).toBe("https://lorem.ipsum");
    expect(data.webhooksetting.activated).toBe(true);
  });

  it("should forbid access to a webhook setting when user is MEMBER of the webhook company", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const whs = await webhookSettingFactory({
      company,
      endpointUri: "https://lorem.ipsum"
    });

    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "webhooksetting">>(
      GET_WEBHOOK_SETTING,
      { variables: { id: whs.id } }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le webhook avec l'identifiant "${whs.id}" n'existe pas ou vous n'avez pas les permissions pour y accéder.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should forbid access to a webhook setting whose company does not belong to user", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");

    const somebodyElseCompany = await companyFactory();

    const whs = await webhookSettingFactory({
      company: somebodyElseCompany,
      endpointUri: "https://lorem.ipsum"
    });

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "webhooksetting">>(
      GET_WEBHOOK_SETTING,
      { variables: { id: whs.id } }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le webhook avec l'identifiant "${whs.id}" n'existe pas ou vous n'avez pas les permissions pour y accéder.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
