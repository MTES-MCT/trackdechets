import { Job } from "bull";
import axios from "axios";
import { resetDatabase } from "../../../../integration-tests/helper";
import { companyFactory } from "../../../__tests__/factories";
import { clearWebhookSetting } from "../../../common/redis/webhooksettings";
import { webhookSettingFactory } from "../../../webhooks/__tests__/factories";
import { WebhookQueueItem } from "../../producers/webhooks";
import { sendHookJob } from "../sendHook";

jest.mock("axios");

describe("sendHook", () => {
  beforeEach(() => {
    (axios.post as jest.Mock).mockClear();
  });

  afterEach(async () => {
    await resetDatabase();
    await clearWebhookSetting();
  });

  describe("sendHookJob", () => {
    it("should send a request with BSDD id to active webhook", async () => {
      // Given
      const company = await companyFactory();

      await webhookSettingFactory({
        company: company,
        token: "secret",
        endpointUri: "https://company.fr/endpoint"
      });

      (axios.post as jest.Mock<any>).mockImplementation(() =>
        Promise.resolve({ status: 200 })
      );

      // When
      await sendHookJob({
        data: {
          id: "bsd-id",
          sirets: [company.siret!],
          action: "CREATE"
        }
      } as Job<WebhookQueueItem>);

      // Then
      expect(axios.post as jest.Mock<any>).toHaveBeenCalledTimes(1);
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company.fr/endpoint",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret" } }
      );
    });

    it("should NOT send a request with BSDD id to inactive webhook", async () => {
      // Given
      const company = await companyFactory();

      await webhookSettingFactory({
        company: company,
        token: "secret",
        endpointUri: "https://company.fr/endpoint",
        activated: false
      });

      (axios.post as jest.Mock<any>).mockImplementation(() =>
        Promise.resolve({ status: 200 })
      );

      // When
      await sendHookJob({
        data: {
          id: "bsd-id",
          sirets: [company.siret!],
          action: "CREATE"
        }
      } as Job<WebhookQueueItem>);

      // Then
      expect(axios.post as jest.Mock<any>).toHaveBeenCalledTimes(0);
    });

    it("should send a request with BSDD id to all active webhooks", async () => {
      // Given
      const company1 = await companyFactory({ webhookSettingsLimit: 2 });
      const company2 = await companyFactory();

      await webhookSettingFactory({
        company: company1,
        token: "secret-wh1",
        endpointUri: "https://company1.fr/endpoint1"
      });
      await webhookSettingFactory({
        company: company1,
        token: "secret-wh2",
        endpointUri: "https://company1.fr/endpoint2"
      });
      await webhookSettingFactory({
        company: company2,
        token: "secret-wh3",
        endpointUri: "https://company2.fr/endpoint1"
      });

      (axios.post as jest.Mock<any>).mockImplementation(() =>
        Promise.resolve({ status: 200 })
      );

      // When
      await sendHookJob({
        data: {
          id: "bsd-id",
          sirets: [company1.siret!, company2.siret!],
          action: "CREATE"
        }
      } as Job<WebhookQueueItem>);

      // Then
      expect(axios.post as jest.Mock<any>).toHaveBeenCalledTimes(3);
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company1.fr/endpoint1",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh1" } }
      );
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company1.fr/endpoint2",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh2" } }
      );
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company2.fr/endpoint1",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh3" } }
      );
    });

    it("should send a request with BSDD id to all active webhooks and skip inactive ones", async () => {
      // Given
      const company1 = await companyFactory({ webhookSettingsLimit: 2 });
      const company2 = await companyFactory();
      const company3 = await companyFactory();

      await webhookSettingFactory({
        company: company1,
        token: "secret-wh1",
        endpointUri: "https://company1.fr/endpoint1"
      });
      await webhookSettingFactory({
        company: company1,
        token: "secret-wh2",
        endpointUri: "https://company1.fr/endpoint2"
      });
      await webhookSettingFactory({
        company: company1,
        token: "secret",
        endpointUri: "https://company1.fr/endpoint3",
        activated: false
      });
      await webhookSettingFactory({
        company: company2,
        token: "secret-wh3",
        endpointUri: "https://company2.fr/endpoint1"
      });
      await webhookSettingFactory({
        company: company3,
        token: "secret",
        endpointUri: "https://company3.fr/endpoint1",
        activated: false
      });

      (axios.post as jest.Mock<any>).mockImplementation(() =>
        Promise.resolve({ status: 200 })
      );

      // When
      await sendHookJob({
        data: {
          id: "bsd-id",
          sirets: [company1.siret!, company2.siret!],
          action: "CREATE"
        }
      } as Job<WebhookQueueItem>);

      // Then
      expect(axios.post as jest.Mock<any>).toHaveBeenCalledTimes(3);
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company1.fr/endpoint1",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh1" } }
      );
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company1.fr/endpoint2",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh2" } }
      );
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company2.fr/endpoint1",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh3" } }
      );
    });

    it("if the call to one webhook fails, should still call the others", async () => {
      // Given
      const company1 = await companyFactory({ webhookSettingsLimit: 2 });
      const company2 = await companyFactory();

      const whs1 = await webhookSettingFactory({
        company: company1,
        token: "secret-wh1",
        endpointUri: "https://company1.fr/endpoint1"
      });
      const whs2 = await webhookSettingFactory({
        company: company1,
        token: "secret-wh2",
        endpointUri: "https://company1.fr/endpoint2"
      });
      const whs3 = await webhookSettingFactory({
        company: company2,
        token: "secret-wh3",
        endpointUri: "https://company2.fr/endpoint1"
      });

      (axios.post as jest.Mock<any>).mockImplementation(url => {
        if (url === "https://company1.fr/endpoint1")
          return Promise.resolve({ status: 404 });
        return Promise.resolve({ status: 200 });
      });

      // When
      expect.assertions(9);
      try {
        await sendHookJob({
          data: {
            id: "bsd-id",
            sirets: [company1.siret!, company2.siret!],
            action: "CREATE"
          }
        } as Job<WebhookQueueItem>);
      } catch (e) {
        expect(e).not.toBeUndefined();
        expect(e.message.startsWith(`Webhook job threw errors`)).toBeTruthy();

        // Company1 endpoint1 should have failed
        expect(e.message).toContain(
          `Webhook requets fail for orgId ${company1.orgId} and endpoint ${whs1.endpointUri}`
        );

        // Other endpoints should be ok
        expect(e.message).not.toContain(whs2.endpointUri);
        expect(e.message).not.toContain(whs3.endpointUri);
      }

      // Then
      expect(axios.post as jest.Mock<any>).toHaveBeenCalledTimes(3);
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company1.fr/endpoint1",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh1" } }
      );
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company1.fr/endpoint2",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh2" } }
      );
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company2.fr/endpoint1",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh3" } }
      );
    });

    it("if the calls to one company's webhooks fail, should still call the others", async () => {
      // Given
      const company1 = await companyFactory({ webhookSettingsLimit: 2 });
      const company2 = await companyFactory();

      const whs1 = await webhookSettingFactory({
        company: company1,
        token: "secret-wh1",
        endpointUri: "https://company1.fr/endpoint1"
      });
      const whs2 = await webhookSettingFactory({
        company: company1,
        token: "secret-wh2",
        endpointUri: "https://company1.fr/endpoint2"
      });
      const whs3 = await webhookSettingFactory({
        company: company2,
        token: "secret-wh3",
        endpointUri: "https://company2.fr/endpoint1"
      });

      (axios.post as jest.Mock<any>).mockImplementation(url => {
        if (url.startsWith("https://company1.fr"))
          return Promise.resolve({ status: 404 });
        return Promise.resolve({ status: 200 });
      });

      // When
      expect.assertions(9);
      try {
        await sendHookJob({
          data: {
            id: "bsd-id",
            sirets: [company1.siret!, company2.siret!],
            action: "CREATE"
          }
        } as Job<WebhookQueueItem>);
      } catch (e) {
        expect(e).not.toBeUndefined();
        expect(e.message.startsWith(`Webhook job threw errors`)).toBeTruthy();

        // Company1 endpoints should have failed
        expect(e.message).toContain(
          `Webhook requets fail for orgId ${company1.orgId} and endpoint ${whs1.endpointUri}`
        );
        expect(e.message).toContain(
          `Webhook requets fail for orgId ${company1.orgId} and endpoint ${whs2.endpointUri}`
        );

        // Company2 endpoint should be ok
        expect(e.message).not.toContain(whs3.endpointUri);
      }

      // Then
      expect(axios.post as jest.Mock<any>).toHaveBeenCalledTimes(3);
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company1.fr/endpoint1",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh1" } }
      );
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company1.fr/endpoint2",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh2" } }
      );
      expect(axios.post as jest.Mock).toHaveBeenCalledWith(
        "https://company2.fr/endpoint1",
        [{ action: "CREATE", id: "bsd-id" }],
        { timeout: 5000, headers: { Authorization: "Bearer: secret-wh3" } }
      );
    });
  });
});
