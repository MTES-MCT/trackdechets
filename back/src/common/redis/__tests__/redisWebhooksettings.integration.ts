import {
  handleWebhookFail,
  getWebhookSettings,
  clearWebhookSetting
} from "../webhooksettings";
import { webhookSettingFactory } from "../../../webhooks/__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { companyFactory } from "../../../__tests__/factories";
import { prisma } from "@td/prisma";

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
    let redisWhs = await getWebhookSettings(company.orgId);

    expect(redisWhs.length).toBe(1);
    expect(redisWhs[0].endpointUri).toBe("https://lorem.ipsum");

    // When
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");

    // Then
    redisWhs = await getWebhookSettings(company.orgId);

    expect(redisWhs.length).toBe(1);
    expect(redisWhs[0].endpointUri).toBe("https://lorem.ipsum");

    // Go over limit
    await handleWebhookFail(company.orgId, "https://lorem.ipsum");

    const updatedWhs = await prisma.webhookSetting.findUniqueOrThrow({
      where: { id: whs.id }
    });
    expect(updatedWhs.activated).toBe(false);
    redisWhs = await getWebhookSettings(company.orgId);
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

    let redisWhsCompany1 = await getWebhookSettings(company1.orgId);
    expect(redisWhsCompany1.length).toBe(2);
    let endpointUris1 = redisWhsCompany1.map(r => r.endpointUri);
    expect(endpointUris1.sort()).toEqual([
      "https://url1.fr",
      "https://url2.fr"
    ]);

    let redisWhsCompany2 = await getWebhookSettings(company2.orgId);
    expect(redisWhsCompany2.length).toBe(1);
    let endpointUris2 = redisWhsCompany2.map(r => r.endpointUri);
    expect(endpointUris2.sort()).toEqual(["https://url3.fr"]);

    // When
    await handleWebhookFail(company1.orgId, "https://url2.fr");
    await handleWebhookFail(company1.orgId, "https://url2.fr");
    await handleWebhookFail(company1.orgId, "https://url2.fr");
    await handleWebhookFail(company1.orgId, "https://url2.fr");
    await handleWebhookFail(company1.orgId, "https://url2.fr");

    // Then
    redisWhsCompany1 = await getWebhookSettings(company1.orgId);
    expect(redisWhsCompany1.length).toBe(2);
    endpointUris1 = redisWhsCompany1.map(r => r.endpointUri);
    expect(endpointUris1.sort()).toEqual([
      "https://url1.fr",
      "https://url2.fr"
    ]);

    redisWhsCompany2 = await getWebhookSettings(company2.orgId);
    expect(redisWhsCompany2.length).toBe(1);
    endpointUris2 = redisWhsCompany2.map(r => r.endpointUri);
    expect(endpointUris2.sort()).toEqual(["https://url3.fr"]);

    // Go over limit
    await handleWebhookFail(company1.orgId, "https://url2.fr");

    // Then
    const updatedWhs = await prisma.webhookSetting.findUniqueOrThrow({
      where: { id: whs2.id, endpointUri: whs2.endpointUri }
    });
    expect(updatedWhs.activated).toBe(false);

    redisWhsCompany1 = await getWebhookSettings(company1.orgId);
    expect(redisWhsCompany1.length).toBe(1);
    endpointUris1 = redisWhsCompany1.map(r => r.endpointUri);
    expect(endpointUris1.sort()).toEqual(["https://url1.fr"]);

    redisWhsCompany2 = await getWebhookSettings(company2.orgId);
    expect(redisWhsCompany2.length).toBe(1);
    endpointUris2 = redisWhsCompany2.map(r => r.endpointUri);
    expect(endpointUris2.sort()).toEqual(["https://url3.fr"]);
  });
});
