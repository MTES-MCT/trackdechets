import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { gql } from "graphql-tag";
import { webhookSettingFactory } from "../../../__tests__/factories";
import {
  getWebhookSettings,
  clearWebhookSetting
} from "../../../../common/redis/webhooksettings";
import { prisma } from "@td/prisma";

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

  it("should delete targeted webhook setting and no other", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      webhookSettingsLimit: 2
    });
    const whs1 = await webhookSettingFactory({
      company,
      token: "secret",
      endpointUri: "https://url1.fr"
    });
    const whs2 = await webhookSettingFactory({
      company,
      token: "secret",
      endpointUri: "https://url2.fr"
    });

    // When
    const { mutate } = makeClient(user);

    await mutate<Pick<Mutation, "createWebhookSetting">>(
      DELETE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs1.id
        }
      }
    );

    // Then
    const found = await prisma.webhookSetting.findUnique({
      where: { id: whs1.id }
    });
    expect(found).toEqual(null);

    const redisWebhookSettings = await getWebhookSettings(company.orgId);
    expect(redisWebhookSettings.length).toEqual(1);
    const endpointUris = redisWebhookSettings.map(
      settings => settings.endpointUri
    );
    expect(endpointUris).toEqual([whs2.endpointUri]);
  });

  it("should delete targeted webhook setting belonging to targeted company and no other", async () => {
    // Given
    const { user, company: company1 } = await userWithCompanyFactory("ADMIN");
    const { company: company2 } = await userWithCompanyFactory("ADMIN");
    const whs1 = await webhookSettingFactory({
      company: company1,
      token: "secret",
      endpointUri: "https://url1.fr"
    });
    const whs2 = await webhookSettingFactory({
      company: company2,
      token: "secret",
      endpointUri: "https://url1.fr"
    });

    // When
    const { mutate } = makeClient(user);

    await mutate<Pick<Mutation, "createWebhookSetting">>(
      DELETE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs1.id
        }
      }
    );

    // Then

    // Company 1
    const found1 = await prisma.webhookSetting.findUnique({
      where: { id: whs1.id }
    });
    expect(found1).toEqual(null);

    const redisWebhookSettings1 = await getWebhookSettings(company1.orgId);
    expect(redisWebhookSettings1.length).toEqual(0);

    // Company 2
    const found2 = await prisma.webhookSetting.findUnique({
      where: { id: whs2.id }
    });
    expect(found2).not.toEqual(null);

    const redisWebhookSettings2 = await getWebhookSettings(company2.orgId);
    expect(redisWebhookSettings2.length).toEqual(1);
  });
});
