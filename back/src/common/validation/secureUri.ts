/**
 * Custom validation function for secure URIs (OAuth redirects, webhooks, etc.)
 *
 * Security measures implemented:
 * 1. Enforces HTTPS (with localhost exception in development)
 * 2. Blocks private IP ranges (prevents SSRF attacks):
 *    - 10.0.0.0/8 (Class A private)
 *    - 172.16.0.0/12 (Class B private)
 *    - 192.168.0.0/16 (Class C private)
 *    - 169.254.0.0/16 (Link-local addresses)
 * 3. Blocks loopback addresses (127.0.0.1, ::1)
 *
 * This prevents SSRF attacks and other security vulnerabilities.
 */
export const validateSecureUri = (uri: string): boolean => {
  if (!uri) return false;

  try {
    const url = new URL(uri);

    // Only allow HTTPS (except for localhost in development)
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Block localhost variations in production
    if (process.env.NODE_ENV === "production") {
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]"
      ) {
        return false;
      }
    }

    // Always block loopback IPs (except localhost hostname in dev)
    if (hostname === "127.0.0.1" || hostname === "[::1]") {
      return false;
    }

    // Block private IP ranges (RFC 1918) - always block these
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = hostname.match(ipv4Regex);
    if (ipv4Match) {
      const [, a, b, _c, _d] = ipv4Match.map(Number);
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      if (
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        // Link-local addresses
        (a === 169 && b === 254)
      ) {
        return false;
      }
    }

    // Block IPv6 private ranges
    if (hostname.startsWith("[fc") || hostname.startsWith("[fd")) {
      return false; // Unique local addresses (FC00::/7)
    }

    return true;
  } catch {
    return false;
  }
};
