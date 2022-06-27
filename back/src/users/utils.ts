import { hash } from "bcrypt";
import crypto from "crypto";
import * as yup from "yup";
import { base32Encode } from "../utils";
import { EMAIL_PROVIDER_DOMAINS } from "../common/constants/emailProviderDomain";

const saltRound = 10;
const minimalPasswordLength = 8; // update frontend validation if this value is edited

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= minimalPasswordLength;
}

export function hashPassword(password: string) {
  return hash(password, saltRound);
}

/**
 * Generates a cryptographically-sure random 10 characters password
 */
export function generatePassword(): string {
  const randomHex = crypto.randomBytes(7).toString("hex");
  return base32Encode(parseInt(randomHex, 16)).slice(-10).toLocaleLowerCase();
}

export const getEmailDomain = email =>
  email.substring(email.lastIndexOf("@") + 1);

/**
 * This function hides part of an email
 * john.snow@trackdechets.fr => jo***@trackdechets.fr
 */
export function partiallyHideEmail(email: string) {
  // validate email or throw error
  yup.string().email().validateSync(email);
  const parts = email.split("@");
  if (parts[0].length <= 2) {
    return `${parts[0]}****@${parts[1]}`;
  }
  const hide = email.split("@")[0].length - 2;
  const r = new RegExp(`.{${hide}}@`);
  return email.replace(r, "****@");
}

/**
 *
 * Can user (userEmail) see a non redacted adminEmail
 * If adminEmail belongs to a public email provider (gmail, protonmail etc), deny
 * Else, if adminEmail and publicEmail belong to the same domain name (same company), allow
 */
export const canSeeEmail = (adminEmail: string, userEmail: string): boolean => {
  const adminEmailDomain = getEmailDomain(adminEmail);
  // filter out gmail, yahoo, etc
  if (EMAIL_PROVIDER_DOMAINS.includes(adminEmailDomain)) {
    return false;
  }
  const userEmailDomain = getEmailDomain(userEmail);
  // do they belong to the same domain
  return userEmailDomain === adminEmailDomain;
};

export const redactOrShowEmail = (
  adminEmail: string,
  userEmail: string
): string => {
  return canSeeEmail(adminEmail, userEmail)
    ? adminEmail
    : partiallyHideEmail(adminEmail);
};
