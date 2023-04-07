import { redisClient, generateKey, setOrIncr, setInCache } from "./redis";

export const getUserLoginFailedKey = (email: string): string =>
  generateKey("userLoginFailed", email);

const FAILED_LOGIN_EXPIRATION = 10 * 60; // 10 minutes
/**
 * Store failed login attemps, each attempts resets expiration in FAILED_LOGIN_EXPIRATION mns
 * @param userEmail
 */
export async function setUserLoginFailed(userEmail: string): Promise<void> {
  const key = getUserLoginFailedKey(userEmail);
  await setOrIncr(key, FAILED_LOGIN_EXPIRATION);
}

const FAILED_ATTEMPTS_BEFORE_CAPTCHA = 3; // Captcha is displayed at 4th attempt (after 3 fails)
export async function doesUserLoginNeedsCaptcha(
  userEmail: string
): Promise<boolean> {
  const key = getUserLoginFailedKey(userEmail);
  const redisValue = (await redisClient.get(key).catch(_ => 0)) ?? 0;
  // Captcha is displayed a the N+1th attempt, so we substract 1
  return +redisValue >= FAILED_ATTEMPTS_BEFORE_CAPTCHA - 1;
}

/**
 * Delete failed login entry
 * @param userEmail
 */
export async function clearUserLoginNeedsCaptcha(
  userEmail: string
): Promise<void> {
  const key = getUserLoginFailedKey(userEmail);
  await redisClient.del(key);
}

export const getCaptchaTokenKey = (captchaToken: string): string =>
  generateKey("captchaToken", captchaToken);

const CAPTCHA_TOKEN_EXPIRATION = 3 * 60; // 3 minutes
/**
 * Set captcha token entry in redis for CAPTCHA_TOKEN_EXPIRATION seconds
 * @param captchaToken
 */
export async function setCaptchaToken(
  captchaToken: string,
  captchaString: string
): Promise<void> {
  const key = getCaptchaTokenKey(captchaToken);
  await setInCache(key, captchaString, { EX: CAPTCHA_TOKEN_EXPIRATION });
}

export async function getCaptchaToken(captchaToken: string): Promise<string> {
  const key = getCaptchaTokenKey(captchaToken);
  try {
    const token = await redisClient.get(key);
    return token ?? "";
  } catch (_) {
    return "";
  }
}
export async function clearCaptchaToken(captchaToken: string): Promise<void> {
  const key = getCaptchaTokenKey(captchaToken);
  await redisClient.del(key);
}
