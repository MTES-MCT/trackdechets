import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { redisClient, setInCache } from "../../../common/redis";

const SIRENE_API_TOKEN_URL = "https://api.insee.fr/token";
export const INSEE_TOKEN_KEY = "insee_token";
const { INSEE_SECRET } = process.env;

/**
 * Generates INSEE Sirene API token
 */
async function generateToken(): Promise<string> {
  const headers = {
    Authorization: `Basic ${INSEE_SECRET}`,
    "Content-Type": "application/x-www-form-urlencoded"
  };

  const response = await axios.post(
    SIRENE_API_TOKEN_URL,
    "grant_type=client_credentials",
    { headers }
  );

  return response.data.access_token;
}

/**
 * Generates a token and save it to redis cache
 */
async function renewToken(): Promise<void> {
  const token = await generateToken();
  await setInCache(INSEE_TOKEN_KEY, token);
}

/**
 * Retrives token from redis cache
 */
export async function getToken(): Promise<string> {
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
