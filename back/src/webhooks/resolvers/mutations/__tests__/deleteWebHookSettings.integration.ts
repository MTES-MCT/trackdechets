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
import prisma from "../../../../prisma";

const DELETE_WEBHOOK_SETTING = gql`
  mutation DeleteWebhookSetting($id: ID!) {
    deleteWebhookSetting(id: $id) {
      id
      createdAt
      endpointUri
      orgId
      activated
    }
  }
`;

describe("Mutation.deleteWebhookSetting", () => {
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
    const { errors } = await mutate<Pick<Mutation, "createWebhookSetting">>(
      DELETE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs.id
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

  it("should delete a webhook setting", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const whs = await webhookSettingFactory({
      company,
      token: "secret",
      endpointUri: "https://lorem.ipsum"
    });
    const { mutate } = makeClient(user);

    await mutate<Pick<Mutation, "createWebhookSetting">>(
      DELETE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs.id
        }
      }
    );
    const found = await prisma.webhookSetting.findUnique({
      where: { id: whs.id }
    });
    expect(found).toEqual(null);

    const redisWebhookSettings = await getWebhookSettings(company.orgId);
    expect(redisWebhookSettings.length).toEqual(0);
  });

  it("should forbid to delete a webhook setting whose company does not belong to current user", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const company = await companyFactory();
    const whs = await webhookSettingFactory({
      company,
      token: "secret",
      endpointUri: "https://lorem.ipsum"
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createWebhookSetting">>(
      DELETE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs.id
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
