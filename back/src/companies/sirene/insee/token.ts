import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { randomInt } from "node:crypto";
import { prisma } from "@td/prisma";
import { redisClient, setInCache } from "../../../common/redis";
import { aesDecrypt, aesEncrypt } from "../../../utils";

const SIRENE_API_TOKEN_URL =
  "https://auth.insee.net/auth/realms/apim-gravitee/protocol/openid-connect/token";
const SIRENE_API_PASSWORD_RENEWAL_URL =
  "https://api.insee.fr/api-sirene/prive/3.11/renouvellement";
const INSEE_TOKEN_EX = 300;

export const INSEE_TOKEN_KEY = "insee_token";
export const INSEE_PASSWORD_CREDENTIAL_KEY = "insee_password";
export const INSEE_PASSWORD_VALIDITY_MS = 90 * 24 * 60 * 60 * 1000;
export const INSEE_PASSWORD_RENEWAL_MARGIN_MS = 5 * 24 * 60 * 60 * 1000;

function getInseeClientConfig(): {
  inseeClientId: string;
  inseeClientSecret: string;
  inseeUsername: string;
} {
  const inseeClientId = process.env.INSEE_CLIENT_ID;
  const inseeClientSecret = process.env.INSEE_CLIENT_SECRET;
  const inseeUsername = process.env.INSEE_USERNAME;

  if (!inseeClientId || !inseeClientSecret || !inseeUsername) {
    throw new Error(
      "Missing INSEE configuration: INSEE_CLIENT_ID, INSEE_CLIENT_SECRET and INSEE_USERNAME are required."
    );
  }

  return { inseeClientId, inseeClientSecret, inseeUsername };
}

type InseeJwtPayload = {
  pwdChangedTime?: string;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  return Buffer.from(padded, "base64").toString("utf8");
}

export function parsePwdChangedTime(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/[-:T]/g, "")
    .replace(/\.\d+Z?$/, "")
    .replace(/Z$/, "");

  if (!/^\d{14}$/.test(normalized)) {
    return null;
  }

  const year = normalized.slice(0, 4);
  const month = normalized.slice(4, 6);
  const day = normalized.slice(6, 8);
  const hour = normalized.slice(8, 10);
  const minute = normalized.slice(10, 12);
  const second = normalized.slice(12, 14);
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function decodeJwtPayload(token: string): InseeJwtPayload | null {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) {
      return null;
    }
    return JSON.parse(decodeBase64Url(payloadSegment)) as InseeJwtPayload;
  } catch (_error) {
    return null;
  }
}

export function shouldRenewInseePassword(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const pwdChangedAt = parsePwdChangedTime(payload?.pwdChangedTime);

  if (!pwdChangedAt) {
    return false;
  }

  const expiresAt = new Date(
    pwdChangedAt.getTime() + INSEE_PASSWORD_VALIDITY_MS
  );
  return Date.now() >= expiresAt.getTime() - INSEE_PASSWORD_RENEWAL_MARGIN_MS;
}

function passwordHasRequiredComplexity(password: string): boolean {
  if (password.length < 12) {
    return false;
  }

  const categories = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;

  return categories >= 3;
}

function generatePassword(): string {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()-_=+[]{};:,.<>?/";
  const groups = [uppercase, lowercase, digits, special];
  const requiredChars = groups.map(
    group => group[randomInt(group.length)]
  );
  const pool = groups.join("");
  const chars = [...requiredChars];

  while (chars.length < 12) {
    chars.push(pool[randomInt(pool.length)]);
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(index + 1);
    [chars[index], chars[randomIndex]] = [chars[randomIndex], chars[index]];
  }

  const nextPassword = chars.join("");
  return passwordHasRequiredComplexity(nextPassword)
    ? nextPassword
    : generatePassword();
}

async function getStoredPassword(): Promise<string | null> {
  const credential = await prisma.inseePasswordCredential.findUnique({
    where: { key: INSEE_PASSWORD_CREDENTIAL_KEY }
  });

  if (!credential) {
    return null;
  }

  return aesDecrypt(credential.encryptedPassword);
}

async function saveStoredPassword(
  password: string,
  passwordChangedAt: Date
): Promise<void> {
  const encrypted = aesEncrypt(password);

  await prisma.inseePasswordCredential.upsert({
    where: { key: INSEE_PASSWORD_CREDENTIAL_KEY },
    create: {
      key: INSEE_PASSWORD_CREDENTIAL_KEY,
      encryptedPassword: encrypted,
      passwordChangedAt
    },
    update: {
      encryptedPassword: encrypted,
      passwordChangedAt
    }
  });
}

async function resolveStoredPassword(): Promise<string> {
  const password = await getStoredPassword();

  if (!password) {
    throw new Error(
      "Aucun mot de passe INSEE n'est enregistré dans la base. Il faut initialiser InseePasswordCredential avant d'utiliser l'API Sirene."
    );
  }

  return password;
}

async function renewPassword(
  currentPassword: string,
  jwt: string
): Promise<string> {
  const nextPassword = generatePassword();

  if (nextPassword === currentPassword) {
    throw new Error(
      "INSEE password generation produced a value identical to the current password."
    );
  }

  try {
    await axios.post(
      SIRENE_API_PASSWORD_RENEWAL_URL,
      {
        oldPassword: currentPassword,
        newPassword: nextPassword
      },
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error: any) {
    console.error(
      "[INSEE_DEBUG] renewPassword: renewal endpoint failed",
      error
    );
    if (error.response?.status === 400) {
      throw new Error(
        "Le renouvellement du mot de passe INSEE a été refusé par l'API : ancien mot de passe invalide ou nouveau mot de passe non conforme à la politique INSEE."
      );
    }
    throw error;
  }

  const renewedJwt = await generateTokenWithPassword(nextPassword);
  const passwordChangedAt = getPwdChangedTimeFromToken(renewedJwt);

  if (!passwordChangedAt) {
    throw new Error(
      "Le JWT INSEE renouvelé ne contient pas de pwdChangedTime exploitable pour mettre à jour la date métier du mot de passe."
    );
  }

  await saveStoredPassword(nextPassword, passwordChangedAt);
  return nextPassword;
}

function getPwdChangedTimeFromToken(token: string): Date | null {
  const payload = decodeJwtPayload(token);
  return parsePwdChangedTime(payload?.pwdChangedTime);
}

export async function generateToken(): Promise<string> {
  const currentPassword = await resolveStoredPassword();
  const jwt = await generateTokenWithPassword(currentPassword);

  if (shouldRenewInseePassword(jwt)) {
    const renewedPassword = await renewPassword(currentPassword, jwt);
    return generateTokenWithPassword(renewedPassword);
  }

  return jwt;
}

async function renewToken(): Promise<void> {
  const token = await generateToken();
  await setInCache(INSEE_TOKEN_KEY, token, { EX: INSEE_TOKEN_EX });
}

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
  async function get() {
    let token = await getToken();

    if (token === null) {
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
    return await get();
  } catch (err) {
    if (err.response?.status === 401) {
      await renewToken();
      return get();
    }
    throw err;
  }
}

async function generateTokenWithPassword(password: string): Promise<string> {
  const { inseeClientId, inseeClientSecret, inseeUsername } =
    getInseeClientConfig();
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("client_id", inseeClientId);
  params.append("client_secret", inseeClientSecret);
  params.append("username", inseeUsername);
  params.append("password", password);

  const response = await axios.post<{ access_token: string }>(
    SIRENE_API_TOKEN_URL,
    params,
    { headers }
  );

  return response.data.access_token;
}

export async function checkAndRenewInseePasswordIfNeeded(): Promise<boolean> {
  const currentPassword = await resolveStoredPassword();
  const jwt = await generateTokenWithPassword(currentPassword);

  if (!shouldRenewInseePassword(jwt)) {
    console.log(
      "[INSEE_DEBUG] checkAndRenewInseePasswordIfNeeded: password still valid, no renewal needed"
    );
    return false;
  }

  await renewPassword(currentPassword, jwt);
  return true;
}
