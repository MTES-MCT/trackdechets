import {
  handleWebhookFail,
  getWebhookSettings,
  clearWebhookSetting
} from "../webhooksettings";
import { webhookSettingFactory } from "../../../webhooks/__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { companyFactory } from "../../../__tests__/factories";
import { prisma } from "@td/prisma";

const sort = array => array.sort((a, b) => a.localeCompare(b));

export const expectCompanyWebhookSettingsEndpointUrisToBe = async (
  companyOrgId,
  expectedUris
) => {
  const webhookSettings = await getWebhookSettings(companyOrgId);

  expect(webhookSettings.length).toBe(expectedUris.length);

  const uris = webhookSettings.map(w => w.endpointUri);

  expect(sort(uris)).toEqual(sort(expectedUris));
};

describe("webhooksettings redis", () => {
  afterEach(async () => {
    await resetDatabase();
    await clearWebhookSetting();
  });

  it("should deactivate db webhook and remove redis webhook", async () => {
    // Given
    const company = await companyFactory();

    const whs = await webhookSettingFactory({
      company,
      token: "secret",
      endpointUri: "https://lorem.ipsum"
    });
    expect(whs.activated).toBe(true);

    await expectCompanyWebhookSettingsEndpointUrisToBe(company.orgId, [
      "https://lorem.ipsum"
    ]);

    // When
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");

    // Then
    await expectCompanyWebhookSettingsEndpointUrisToBe(company.orgId, [
      "https://lorem.ipsum"
    ]);

    // Go over limit
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");

    // Webhook should be removed
    const updatedWhs = await prisma.webhookSetting.findUniqueOrThrow({
      where: { id: whs.id }
    });
    expect(updatedWhs.activated).toBe(false);
    const redisWhs = await getWebhookSettings(company.orgId);
    expect(redisWhs.length).toBe(0);
  });

  it("should deactivate targeted webhook and no other", async () => {
    // Given
    const company1 = await companyFactory({ webhookSettingsLimit: 2 });
    await webhookSettingFactory({
      company: company1,
      token: "secret",
      endpointUri: "https://url1.fr"
    });
    const whs2 = await webhookSettingFactory({
      company: company1,
      token: "secret",
      endpointUri: "https://url2.fr"
    });

    const company2 = await companyFactory({ webhookSettingsLimit: 2 });
    await webhookSettingFactory({
      company: company2,
      token: "secret",
      endpointUri: "https://url3.fr"
    });

    await expectCompanyWebhookSettingsEndpointUrisToBe(company1.orgId, [
      "https://url1.fr",
      "https://url2.fr"
    ]);

    await expectCompanyWebhookSettingsEndpointUrisToBe(company2.orgId, [
      "https://url3.fr"
    ]);

    // When
    await handleWebhookFail(company1.orgId, "https://url2.fr");
    await handleWebhookFail(company1.orgId, "https://url2.fr");
    await handleWebhookFail(company1.orgId, "https://url2.fr");
    await handleWebhookFail(company1.orgId, "https://url2.fr");
    await handleWebhookFail(company1.orgId, "https://url2.fr");

    // Then
    await expectCompanyWebhookSettingsEndpointUrisToBe(company1.orgId, [
      "https://url1.fr",
      "https://url2.fr"
    ]);

    await expectCompanyWebhookSettingsEndpointUrisToBe(company2.orgId, [
      "https://url3.fr"
    ]);

    // Go over limit
    await handleWebhookFail(company1.orgId, "https://url2.fr");

    // Then
    const updatedWhs = await prisma.webhookSetting.findUniqueOrThrow({
      where: { id: whs2.id, endpointUri: whs2.endpointUri }
    });
    expect(updatedWhs.activated).toBe(false);

    await expectCompanyWebhookSettingsEndpointUrisToBe(company1.orgId, [
      "https://url1.fr"
    ]);

    await expectCompanyWebhookSettingsEndpointUrisToBe(company2.orgId, [
      "https://url3.fr"
    ]);
  });
});
