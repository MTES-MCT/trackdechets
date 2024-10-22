import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { redisClient, setInCache } from "../../../common/redis";

const SIRENE_API_TOKEN_URL =
  "https://auth.insee.net/auth/realms/apim-gravitee/protocol/openid-connect/token";
export const INSEE_TOKEN_KEY = "insee_token";
const { INSEE_CLIENT_SECRET, INSEE_CLIENT_ID, INSEE_USERNAME, INSEE_PASSWORD } =
  process.env;

/**
 * Generates INSEE Sirene API token
 */
async function generateToken(): Promise<string> {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  // Création des paramètres de la requête avec URLSearchParams
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("client_id", INSEE_CLIENT_ID);
  params.append("client_secret", INSEE_CLIENT_SECRET);
  params.append("username", INSEE_USERNAME);
  params.append("password", INSEE_PASSWORD);

  const response = await axios.post<{ access_token: string }>(
    SIRENE_API_TOKEN_URL,
    params,
    { headers }
  );

  return response.data.access_token;
}

// Le token expire au bout de 300 secondes
const INSEE_TOKEN_EX = 300;

/**
 * Generates a token and save it to redis cache
 */
async function renewToken(): Promise<void> {
  const token = await generateToken();
  await setInCache(INSEE_TOKEN_KEY, token, { EX: INSEE_TOKEN_EX });
}

/**
 * Retrives token from redis cache
 */
export async function getToken(): Promise<string | null> {
  return redisClient.get(INSEE_TOKEN_KEY);
}

/**
 * Patched version of axios.get that handles
 * authorization to INSEE API and token renewal
 */
export async function authorizedAxiosGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  // inner function that add authorization header
  async function get() {
    let token = await getToken();
    if (token === null) {
      // token has never been set, renew it
      await renewToken();
      token = await getToken();
    }
    const authHeader = {
      Authorization: `Bearer ${token}`
    };
    return axios.get<T>(url, {
      ...config,
      headers: { ...(config?.headers ? config.headers : {}), ...authHeader }
    });
  }
  try {
    const response = await get();
    return response;
  } catch (err) {
    if (err.response?.status === 401) {
      // Token has expired, renew it
      await renewToken();
      // Retry request after renewal
      return get();
    } else {
      throw err;
    }
  }
}
