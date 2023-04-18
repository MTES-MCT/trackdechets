import { resetDatabase } from "../../../integration-tests/helper";
import { webhookSettingFactory } from "./factories";
import { getWebhookSettings } from "../../common/redis/webhooksettings";
import { aesDecrypt } from "../../utils";

import { companyFactory } from "../../__tests__/factories";
describe("Test Factories", () => {
  afterEach(resetDatabase);

  test("should create a webhookSetting", async () => {
    const company = await companyFactory();
    const whs = await webhookSettingFactory({
      company,
      token: "secret",
      endpointUri: `https://mycompany.com/webhook/${company.orgId}`
    });

    expect(whs.id).toBeTruthy();
    expect(whs.orgId).toBe(company.orgId);
    expect(whs.activated).toBe(true);

    const redisWebhookSettings = await getWebhookSettings(company.orgId);

    // check webhook is cached in redis
    expect(redisWebhookSettings.length).toEqual(1);
    expect(redisWebhookSettings[0].endpointUri).toEqual(
      `https://mycompany.com/webhook/${company.orgId}`
    );
    expect(aesDecrypt(redisWebhookSettings[0].token)).toEqual("secret");
  });
});
