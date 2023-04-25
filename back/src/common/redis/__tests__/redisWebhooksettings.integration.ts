import {
  handleWebhookFail,
  getWebhookSettings,
  clearWebhookSetting
} from "../webhooksettings";
import { webhookSettingFactory } from "../../../webhooks/__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";
import { companyFactory } from "../../../__tests__/factories";
import prisma from "../../../prisma";

describe("webhooksettings redis", () => {
  afterEach(async () => {
    await resetDatabase();
    await clearWebhookSetting();
  });
  it("should deactivate db whebook and remove redis webhook", async () => {
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

    await handleWebhookFail(company.orgId);
    await handleWebhookFail(company.orgId);
    await handleWebhookFail(company.orgId);
    await handleWebhookFail(company.orgId);
    await handleWebhookFail(company.orgId);
    redisWhs = await getWebhookSettings(company.orgId);
    expect(redisWhs.length).toBe(1);
    expect(redisWhs[0].endpointUri).toBe("https://lorem.ipsum");
    await handleWebhookFail(company.orgId);

    const updatedWhs = await prisma.webhookSetting.findUniqueOrThrow({
      where: { id: whs.id }
    });
    expect(updatedWhs.activated).toBe(false);
    redisWhs = await getWebhookSettings(company.orgId);
    expect(redisWhs.length).toBe(0);
  });
});
