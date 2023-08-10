import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import gql from 'graphql-tag';
import { webhookSettingFactory } from "../../../__tests__/factories";
import {
  getWebhookSettings,
  clearWebhookSetting
} from "../../../../common/redis/webhooksettings";
const UPDATE_WEBHOOK_SETTING = gql`
  mutation UpdateWebhookSetting($id: ID!, $input: WebhookSettingUpdateInput!) {
    updateWebhookSetting(id: $id, input: $input) {
      id
      createdAt
      endpointUri
      orgId
      activated
    }
  }
`;

describe("Mutation.updateWebhookSetting", () => {
  afterEach(async () => {
    await resetDatabase();
    await clearWebhookSetting();
  });

  it("should disallow unauthenticated user", async () => {
    const company = await companyFactory();

    const { mutate } = makeClient();
    const whs = await webhookSettingFactory({
      company,
      token: "secret",
      endpointUri: "https://lorem.ipsum"
    });
    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs.id,
          input: { endpointUri: "https://lorem.ipsum/plop" }
        }
      }
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

  it("should update a webhook setting", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    const whs = await webhookSettingFactory({
      company,

      endpointUri: "https://lorem.ipsum"
    });
    const { data } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs.id,
          input: { endpointUri: "https://lorem.ipsum/plop" }
        }
      }
    );

    expect(data.updateWebhookSetting.endpointUri).toEqual(
      "https://lorem.ipsum/plop"
    );

    // check webhook is cached in redis
    const redisWebhookSettings = await getWebhookSettings(company.orgId);

    expect(redisWebhookSettings.length).toEqual(1);
    expect(redisWebhookSettings[0].endpointUri).toEqual(
      "https://lorem.ipsum/plop"
    );
  });
  it("should forbid short tokens", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    const whs = await webhookSettingFactory({
      company,
      endpointUri: "https://lorem.ipsum"
    });
    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs.id,
          input: { token: "plop" }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: `token must be at least 20 characters`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("should forbid non https uri", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient(user);
    const whs = await webhookSettingFactory({
      company,
      endpointUri: "https://lorem.ipsum"
    });
    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs.id,
          input: { endpointUri: "http://no-ssl.com" }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'url doit être en https`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("should forbid to update a webhook setting whose company does not belong to current user", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const company = await companyFactory();
    const whs = await webhookSettingFactory({
      company,
      token: "loremipsumdolorsitamet1234567890",
      endpointUri: "https://lorem.ipsum"
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs.id,
          input: { endpointUri: "https://lorem.ipsum/plip" }
        }
      }
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
