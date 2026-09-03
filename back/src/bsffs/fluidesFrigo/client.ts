import axios from "axios";
import { FluidesFrigoGetCerfaParams, RestCerfa } from "./types";

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

const TOKEN_RENEW_BUFFER_MS = 60_000;

export class FluidesFrigoConfigError extends Error {}

export class FluidesFrigoApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

class FluidesFrigoClient {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  private getConfig() {
    const clientId = process.env.FF_OIDC_CLIENT_ID;
    const clientSecret = process.env.FF_OIDC_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new FluidesFrigoConfigError(
        "Configuration OAuth2 manquante pour Fluides Frigorigènes."
      );
    }

    return {
      apiBaseUrl: process.env.FF_API_BASE_URL,
      tokenUrl: process.env.FF_OIDC_TOKEN_URL,
      clientId,
      clientSecret,
      timeout: parseInt(process.env.FF_API_TIMEOUT, 10),
      retries: parseInt(process.env.FF_API_RETRIES, 10)
    };
  }

  async getCerfaBySiret(
    params: FluidesFrigoGetCerfaParams
  ): Promise<RestCerfa[]> {
    const token = await this.getValidToken();
    const config = this.getConfig();
    const url = `${config.apiBaseUrl}/api-ext/${params.siret}/cerfa`;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        const response = await axios.get<RestCerfa[]>(url, {
          params: {
            debut: params.debut,
            fin: params.fin,
            identifiantBouteille: params.identifiantBouteille
          },
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: config.timeout
        });

        return response.data;
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          throw error;
        }

        if (error.response?.status === 401) {
          const refreshedToken = await this.renewToken();
          const response = await axios.get<RestCerfa[]>(url, {
            params: {
              debut: params.debut,
              fin: params.fin,
              identifiantBouteille: params.identifiantBouteille
            },
            headers: {
              Authorization: `Bearer ${refreshedToken}`
            },
            timeout: config.timeout
          });

          return response.data;
        }

        if (error.response?.status === 429 && attempt < config.retries) {
          await this.wait(Math.pow(2, attempt + 1) * 1000);
          continue;
        }

        throw new FluidesFrigoApiError(
          "Erreur lors de l'appel à l'API Fluides Frigorigènes.",
          error.response?.status,
          error.response?.data
        );
      }
    }

    throw new FluidesFrigoApiError(
      "Nombre maximal de tentatives atteint pour l'API Fluides Frigorigènes."
    );
  }

  private async getValidToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiresAt > now + TOKEN_RENEW_BUFFER_MS) {
      return this.accessToken;
    }
    return this.renewToken();
  }

  private async renewToken(): Promise<string> {
    const config = this.getConfig();
    const payload = new URLSearchParams();
    payload.append("grant_type", "client_credentials");
    payload.append("client_id", config.clientId);
    payload.append("client_secret", config.clientSecret);

    try {
      const response = await axios.post<TokenResponse>(
        config.tokenUrl,
        payload,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          timeout: config.timeout
        }
      );

      if (!response.data?.access_token || !response.data?.expires_in) {
        throw new FluidesFrigoApiError(
          "Réponse de token OAuth2 invalide pour Fluides Frigorigènes."
        );
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
      return this.accessToken;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      throw new FluidesFrigoApiError(
        "Impossible de récupérer un token OAuth2 Fluides Frigorigènes.",
        error.response?.status,
        error.response?.data
      );
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  resetTokenCache() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }
}

export const fluidesFrigoClient = new FluidesFrigoClient();

export function resetFluidesFrigoTokenCacheForTests() {
  fluidesFrigoClient.resetTokenCache();
}
