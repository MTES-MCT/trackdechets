import {
  validateWebhookCreateInput,
  validateWebhookUpdateInput
} from "../validation";

describe("Webhook validation", () => {
  const baseCreatePayload = {
    companyId: "company_123",
    endpointUri: "https://api.example.com/webhook/endpoint",
    token: "webhook_secret_token_123",
    activated: true
  };

  const baseUpdatePayload = {
    endpointUri: "https://api.example.com/webhook/endpoint",
    token: "webhook_secret_token_123",
    activated: true
  };

  describe("validateWebhookCreateInput", () => {
    describe("should accept valid payloads", () => {
      it("accepts valid webhook configuration", async () => {
        await expect(
          validateWebhookCreateInput(baseCreatePayload)
        ).resolves.toBeDefined();
      });

      it("accepts webhook with secure endpointUri", async () => {
        const payload = {
          ...baseCreatePayload,
          endpointUri:
            "https://webhooks.service.com/api/v2/trackdechets/notifications"
        };
        await expect(
          validateWebhookCreateInput(payload)
        ).resolves.toBeDefined();
      });
    });

    describe("should reject insecure endpoints", () => {
      it("rejects insecure endpointUri", async () => {
        const payload = {
          ...baseCreatePayload,
          endpointUri: "http://api.example.com/webhook/endpoint"
        };
        await expect(validateWebhookCreateInput(payload)).rejects.toThrow();
      });

      it("rejects invalid endpointUri", async () => {
        const payload = {
          ...baseCreatePayload,
          endpointUri: "not-a-valid-url"
        };
        await expect(validateWebhookCreateInput(payload)).rejects.toThrow();
      });
    });

    describe("required fields", () => {
      it("requires companyId", async () => {
        const { companyId, ...payload } = baseCreatePayload;
        await expect(
          validateWebhookCreateInput(payload as any)
        ).rejects.toThrow();
      });

      it("requires endpointUri", async () => {
        const { endpointUri, ...payload } = baseCreatePayload;
        await expect(
          validateWebhookCreateInput(payload as any)
        ).rejects.toThrow();
      });

      it("requires token", async () => {
        const { token, ...payload } = baseCreatePayload;
        await expect(
          validateWebhookCreateInput(payload as any)
        ).rejects.toThrow();
      });
    });
  });

  describe("validateWebhookUpdateInput", () => {
    describe("should accept valid updates", () => {
      it("accepts valid endpoint update", async () => {
        await expect(
          validateWebhookUpdateInput(baseUpdatePayload)
        ).resolves.toBeDefined();
      });

      it("accepts partial updates", async () => {
        const payload = { activated: false };
        await expect(
          validateWebhookUpdateInput(payload)
        ).resolves.toBeDefined();
      });

      it("accepts undefined optional fields", async () => {
        const payload = {
          endpointUri: undefined,
          token: undefined,
          activated: true
        };
        await expect(
          validateWebhookUpdateInput(payload)
        ).resolves.toBeDefined();
      });
    });

    describe("should reject insecure updates", () => {
      it("rejects insecure endpoint updates", async () => {
        const payload = {
          ...baseUpdatePayload,
          endpointUri: "http://insecure.example.com/webhook/endpoint"
        };
        await expect(validateWebhookUpdateInput(payload)).rejects.toThrow();
      });
    });
  });
});
