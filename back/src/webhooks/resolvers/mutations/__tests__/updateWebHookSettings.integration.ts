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
import { clearWebhookSetting } from "../../../../common/redis/webhooksettings";
import { prisma } from "@td/prisma";
import { expectCompanyWebhookSettingsEndpointUrisToBe } from "../../../../common/redis/__tests__/redisWebhooksettings.integration";

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
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const whs = await webhookSettingFactory({
      company,
      endpointUri: "https://lorem.ipsum"
    });

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateWebhookSetting">
    >(UPDATE_WEBHOOK_SETTING, {
      variables: {
        id: whs.id,
        input: { endpointUri: "https://lorem.ipsum/plop" }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.updateWebhookSetting.endpointUri).toEqual(
      "https://lorem.ipsum/plop"
    );

    // Check webhook is cached in redis
    await expectCompanyWebhookSettingsEndpointUrisToBe(company.orgId, [
      "https://lorem.ipsum/plop"
    ]);

    // DB
    const dbWebhookSetting = await prisma.webhookSetting.findFirstOrThrow({
      where: {
        id: whs.id
      }
    });
    expect(dbWebhookSetting.endpointUri).toEqual("https://lorem.ipsum/plop");
  });

  it("if company has several webhookSettings, should update the correct one", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      webhookSettingsLimit: 2
    });
    await webhookSettingFactory({
      company,
      endpointUri: "https://url1.fr"
    });
    const whs2 = await webhookSettingFactory({
      company,
      endpointUri: "https://url2.fr"
    });

    // When
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs2.id,
          input: { endpointUri: "https://url3.fr" }
        }
      }
    );

    // Then
    expect(data.updateWebhookSetting.endpointUri).toEqual("https://url3.fr");

    // Check webhook is cached in redis
    await expectCompanyWebhookSettingsEndpointUrisToBe(company.orgId, [
      "https://url1.fr",
      "https://url3.fr"
    ]);

    // DB
    const dbWebhookSetting = await prisma.webhookSetting.findFirstOrThrow({
      where: {
        id: whs2.id
      }
    });
    expect(dbWebhookSetting.endpointUri).toEqual("https://url3.fr");
  });

  it("two companies can have the same endpointUri (weird but ok)", async () => {
    // Given
    const { user, company: company1 } = await userWithCompanyFactory("ADMIN");
    const { company: company2 } = await userWithCompanyFactory("ADMIN");
    const whs1 = await webhookSettingFactory({
      company: company1,
      endpointUri: "https://url1.fr"
    });
    const whs2 = await webhookSettingFactory({
      company: company2,
      endpointUri: "https://url2.fr"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<
      Pick<Mutation, "updateWebhookSetting">
    >(UPDATE_WEBHOOK_SETTING, {
      variables: {
        id: whs1.id,
        input: { endpointUri: "https://url2.fr" }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.updateWebhookSetting.endpointUri).toEqual("https://url2.fr");

    // Check webhook is cached in redis
    await expectCompanyWebhookSettingsEndpointUrisToBe(company1.orgId, [
      "https://url2.fr"
    ]);

    // DB
    const dbWebhookSetting = await prisma.webhookSetting.findFirstOrThrow({
      where: {
        id: whs2.id
      }
    });
    expect(dbWebhookSetting.endpointUri).toEqual("https://url2.fr");
  });

  it("cannot update another company's webhookSetting", async () => {
    // Given
    const { user, company: company1 } = await userWithCompanyFactory("ADMIN");
    const { company: company2 } = await userWithCompanyFactory("ADMIN");
    await webhookSettingFactory({
      company: company1,
      endpointUri: "https://url1.fr"
    });
    const whs2 = await webhookSettingFactory({
      company: company2,
      endpointUri: "https://url2.fr"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs2.id,
          input: { endpointUri: "https://url3.fr" }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Le webhook avec l'identifiant "${whs2.id}" n'existe pas ou vous n'avez pas les permissions pour y accéder.`
    );
  });

  it("should not allow updating endpointUri to another webhookSetting's endpointUri", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      webhookSettingsLimit: 2
    });
    await webhookSettingFactory({
      company,
      endpointUri: "https://url1.fr"
    });
    const whs2 = await webhookSettingFactory({
      company,
      endpointUri: "https://url2.fr"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs2.id,
          input: { endpointUri: "https://url1.fr" }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Cet établissement a déjà un webhook avec l'endpoint "https://url1.fr"`
    );

    // Nothing should have changed
    await expectCompanyWebhookSettingsEndpointUrisToBe(company.orgId, [
      "https://url1.fr",
      "https://url2.fr"
    ]);
  });

  it("should update targeted company's enpoint and no other", async () => {
    // Given
    const { user, company: company1 } = await userWithCompanyFactory("ADMIN");
    const { company: company2 } = await userWithCompanyFactory("ADMIN");
    const whs1 = await webhookSettingFactory({
      company: company1,
      endpointUri: "https://url1.fr"
    });
    await webhookSettingFactory({
      company: company2,
      endpointUri: "https://url1.fr"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs1.id,
          input: { endpointUri: "https://url2.fr" }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    // Company 1
    await expectCompanyWebhookSettingsEndpointUrisToBe(company1.orgId, [
      "https://url2.fr"
    ]);

    // Company 2
    await expectCompanyWebhookSettingsEndpointUrisToBe(company2.orgId, [
      "https://url1.fr"
    ]);
  });

  it("if deactivating a webhook, should not deactivate the others", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      webhookSettingsLimit: 2
    });
    await webhookSettingFactory({
      company,
      endpointUri: "https://url1.fr"
    });
    const whs2 = await webhookSettingFactory({
      company,
      endpointUri: "https://url2.fr"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs2.id,
          input: { activated: false }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    await expectCompanyWebhookSettingsEndpointUrisToBe(company.orgId, [
      "https://url1.fr"
    ]);
  });

  it("if activating a webhook, should be back into redis", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN", {
      webhookSettingsLimit: 2
    });
    await webhookSettingFactory({
      company,
      endpointUri: "https://url1.fr",
      activated: true
    });
    const whs2 = await webhookSettingFactory({
      company,
      endpointUri: "https://url2.fr",
      activated: false
    });

    // Expect 1
    await expectCompanyWebhookSettingsEndpointUrisToBe(company.orgId, [
      "https://url1.fr"
    ]);

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "updateWebhookSetting">>(
      UPDATE_WEBHOOK_SETTING,
      {
        variables: {
          id: whs2.id,
          input: { activated: true }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    await expectCompanyWebhookSettingsEndpointUrisToBe(company.orgId, [
      "https://url1.fr",
      "https://url2.fr"
    ]);
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
