import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import { redisClient, setInCache } from "../../../common/redis";

const SIRENE_API_TOKEN_URL =
  "https://auth.insee.net/auth/realms/apim-gravitee/protocol/openid-connect/token";

export const INSEE_TOKEN_KEY = "insee_token";

// Le token expire au bout de 300 secondes
const INSEE_TOKEN_EX = 300;

type GenerateTokenOptions = {
  password?: string;
  cache?: boolean;
};

type InseeTokenResponse = {
  access_token: string;
  expires_in?: number;
  token_type?: string;
};

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est manquante`);
  }

  return value;
}

/**
 * Génère un token INSEE.
 *
 * Le mot de passe peut être passé explicitement pendant une rotation.
 * Sinon, la valeur INSEE_PASSWORD de l'environnement est utilisée.
 */
export async function generateToken(
  options: GenerateTokenOptions = {}
): Promise<string> {
  const clientId = getRequiredEnvironmentVariable("INSEE_CLIENT_ID");
  const clientSecret = getRequiredEnvironmentVariable("INSEE_CLIENT_SECRET");
  const username = getRequiredEnvironmentVariable("INSEE_USERNAME");
  const password =
    options.password ?? getRequiredEnvironmentVariable("INSEE_PASSWORD");

  const params = new URLSearchParams();

  params.append("grant_type", "password");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("username", username);
  params.append("password", password);

  try {
    const response = await axios.post<InseeTokenResponse>(
      SIRENE_API_TOKEN_URL,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 15_000
      }
    );

    const token = response.data.access_token;

    if (!token) {
      throw new Error("L'INSEE n'a pas renvoyé de jeton d'accès");
    }

    if (options.cache !== false) {
      await setInCache(INSEE_TOKEN_KEY, token, {
        EX: INSEE_TOKEN_EX
      });
    }

    return token;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        `Échec de génération du token INSEE : HTTP ${
          error.response?.status ?? "inconnu"
        }`
      );
    }

    throw error;
  }
}

/**
 * Génère un token puis le place dans Redis.
 */
export async function renewToken(): Promise<void> {
  await generateToken();
}

/**
 * Supprime le token INSEE actuellement en cache.
 */
export async function clearToken(): Promise<void> {
  await redisClient.del(INSEE_TOKEN_KEY);
}

/**
 * Récupère le token depuis Redis.
 */
export async function getToken(): Promise<string | null> {
  return redisClient.get(INSEE_TOKEN_KEY);
}

/**
 * Version d'axios.get gérant automatiquement l'authentification INSEE.
 */
export async function authorizedAxiosGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  async function get(): Promise<AxiosResponse<T>> {
    let token = await getToken();

    if (token === null) {
      await renewToken();
      token = await getToken();
    }

    if (!token) {
      throw new Error("Impossible de récupérer un token INSEE");
    }

    return axios.get<T>(url, {
      ...config,
      headers: {
        ...(config?.headers ?? {}),
        Authorization: `Bearer ${token}`
      }
    });
  }

  try {
    return await get();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      await clearToken();
      await renewToken();

      return get();
    }

    throw error;
  }
}
