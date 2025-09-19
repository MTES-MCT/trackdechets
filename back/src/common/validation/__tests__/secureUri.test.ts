import { validateSecureUri } from "../secureUri";

describe("validateSecureUri", () => {
  describe("should accept valid URIs", () => {
    it("accepts standard HTTPS URLs", () => {
      expect(
        validateSecureUri("https://api.example.com/webhook/endpoint")
      ).toBe(true);
    });

    it("accepts URLs with complex paths", () => {
      expect(
        validateSecureUri(
          "https://webhooks.service.com/api/v2/trackdechets/notifications"
        )
      ).toBe(true);
    });

    it("accepts URLs on port 8443", () => {
      expect(
        validateSecureUri("https://secure.example.com:8443/webhook/endpoint")
      ).toBe(true);
    });

    it("accepts URLs on any port", () => {
      expect(validateSecureUri("https://api.example.com:3000/webhook")).toBe(
        true
      );
    });

    it("accepts URLs with minimal paths", () => {
      expect(validateSecureUri("https://api.example.com/")).toBe(true);
    });

    it("accepts URLs with query parameters", () => {
      expect(
        validateSecureUri("https://api.example.com/webhook?token=abc123&id=456")
      ).toBe(true);
    });

    it("accepts URLs with fragments", () => {
      expect(validateSecureUri("https://api.example.com/webhook#section")).toBe(
        true
      );
    });

    it("accepts URLs with subdomains", () => {
      expect(
        validateSecureUri("https://webhooks.subdomain.example.com/endpoint")
      ).toBe(true);
    });

    it("accepts localhost in development environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      try {
        expect(validateSecureUri("https://localhost:3000/webhook")).toBe(true);
        expect(validateSecureUri("https://localhost/webhook")).toBe(true);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it("accepts localhost with HTTP in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      try {
        expect(validateSecureUri("http://localhost:3000/webhook")).toBe(true);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe("should reject insecure URIs", () => {
    it("rejects HTTP URLs (except localhost)", () => {
      expect(validateSecureUri("http://api.example.com/webhook/endpoint")).toBe(
        false
      );
    });

    it("rejects empty string", () => {
      expect(validateSecureUri("")).toBe(false);
    });

    it("rejects null/undefined input", () => {
      expect(validateSecureUri(null as any)).toBe(false);
      expect(validateSecureUri(undefined as any)).toBe(false);
    });

    it("rejects invalid URLs", () => {
      expect(validateSecureUri("not-a-valid-url")).toBe(false);
      expect(validateSecureUri("://invalid")).toBe(false);
      expect(validateSecureUri("https://")).toBe(false);
    });

    it("rejects localhost in production environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        expect(validateSecureUri("https://localhost:3000/webhook")).toBe(false);
        expect(validateSecureUri("https://localhost/webhook")).toBe(false);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it("rejects loopback IP addresses (127.0.0.0/8)", () => {
      expect(validateSecureUri("https://127.0.0.1/webhook/endpoint")).toBe(
        false
      );
      expect(validateSecureUri("https://127.0.0.1:8080/webhook")).toBe(false);
      expect(validateSecureUri("https://127.255.255.255/webhook")).toBe(false);
      expect(validateSecureUri("https://127.1.2.3/webhook")).toBe(false);
      expect(validateSecureUri("https://127.0.0.255/webhook")).toBe(false);
      // Just outside the range should be allowed
      expect(validateSecureUri("https://128.0.0.1/webhook")).toBe(true);
    });

    it("rejects IPv6 loopback addresses", () => {
      expect(validateSecureUri("https://[::1]/webhook/endpoint")).toBe(false);
      expect(validateSecureUri("https://::1/webhook/endpoint")).toBe(false);
    });

    it("rejects IPv6 link-local addresses (fe80::/10)", () => {
      expect(validateSecureUri("https://[fe80::1]/webhook")).toBe(false);
      expect(validateSecureUri("https://fe80::1/webhook")).toBe(false);
      expect(validateSecureUri("https://[fe80:abcd::1234]/webhook")).toBe(
        false
      );
    });

    it("rejects private IP ranges (10.x.x.x)", () => {
      expect(validateSecureUri("https://10.0.0.1/webhook/endpoint")).toBe(
        false
      );
      expect(validateSecureUri("https://10.255.255.255/webhook")).toBe(false);
      expect(validateSecureUri("https://10.1.2.3:8080/webhook")).toBe(false);
    });

    it("rejects private IP ranges (172.16-31.x.x)", () => {
      expect(validateSecureUri("https://172.16.0.1/webhook/endpoint")).toBe(
        false
      );
      expect(validateSecureUri("https://172.31.255.255/webhook")).toBe(false);
      expect(validateSecureUri("https://172.20.1.1:3000/webhook")).toBe(false);
    });

    it("rejects private IP ranges (192.168.x.x)", () => {
      expect(validateSecureUri("https://192.168.1.1/webhook/endpoint")).toBe(
        false
      );
      expect(validateSecureUri("https://192.168.255.255/webhook")).toBe(false);
      expect(validateSecureUri("https://192.168.0.1:8080/webhook")).toBe(false);
    });

    it("rejects link-local addresses (169.254.x.x)", () => {
      expect(validateSecureUri("https://169.254.1.1/webhook/endpoint")).toBe(
        false
      );
      expect(validateSecureUri("https://169.254.169.254/metadata")).toBe(false);
    });

    it("rejects IPv6 private ranges", () => {
      expect(validateSecureUri("https://[fc00::1]/webhook")).toBe(false);
      expect(validateSecureUri("https://[fd00::1]/webhook")).toBe(false);
    });

    it("rejects non-HTTP protocols", () => {
      expect(validateSecureUri("ftp://example.com/file")).toBe(false);
      expect(validateSecureUri("file:///etc/passwd")).toBe(false);
      expect(validateSecureUri("ldap://example.com")).toBe(false);
      expect(validateSecureUri("gopher://example.com")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts public IP addresses", () => {
      expect(validateSecureUri("https://8.8.8.8/webhook")).toBe(true);
      expect(validateSecureUri("https://1.1.1.1/webhook")).toBe(true);
    });

    it("rejects borderline private IPs", () => {
      // Just outside private ranges should be allowed
      expect(validateSecureUri("https://11.0.0.1/webhook")).toBe(true);
      expect(validateSecureUri("https://172.15.255.255/webhook")).toBe(true);
      expect(validateSecureUri("https://172.32.0.1/webhook")).toBe(true);
      expect(validateSecureUri("https://192.167.255.255/webhook")).toBe(true);
      expect(validateSecureUri("https://192.169.0.1/webhook")).toBe(true);
    });

    it("handles URLs with username/password", () => {
      expect(validateSecureUri("https://user:pass@example.com/webhook")).toBe(
        true
      );
    });

    it("handles international domain names", () => {
      expect(validateSecureUri("https://例え.テスト/webhook")).toBe(true);
    });
  });
});
