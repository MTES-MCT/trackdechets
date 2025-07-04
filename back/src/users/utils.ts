import { hash } from "bcrypt";
import crypto from "crypto";
import * as yup from "yup";
import { base32Encode } from "../utils";
import { EMAIL_PROVIDER_DOMAINS } from "@td/constants";
import zxcvbn from "zxcvbn";
import { UserInputError } from "../common/errors";

const saltRound = 10;
export const minimalPasswordLength = 12; // update frontend validation if this value is edited
const maximalPasswordLength = 64; // prevent dos attack with insanely long passwords
const minimalPasswordScore = 3; // ensure there is at least 8 different characters in password
export const passwordVersion = 2; // 11/2022
const CHAR_CLASSES_REGEX = {
  lower: /[a-z]/,
  upper: /[A-Z]/,
  number: /[0-9]/,
  special: /[^a-zA-Z0-9]/
};

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= minimalPasswordLength;
}

export function isPasswordShortEnough(password: string): boolean {
  return password.length <= maximalPasswordLength;
}

export function isPasswordContainingAllCharClasses(password: string): boolean {
  return Object.values(CHAR_CLASSES_REGEX).every(regex => regex.test(password));
}

export function isPasswordStrongEnough(password: string): boolean {
  const { score } = zxcvbn(password);
  return score >= minimalPasswordScore;
}

export function hashPassword(password: string) {
  return hash(password, saltRound);
}

/**
 * Check password meets our criteria
 * - min length
 * - max length
 * - at least one of each character class (lower, upper, number, special)
 * - entropy (zxcvbn score >= 3)
 * @param trimmedPassword
 */
export function checkPasswordCriteria(trimmedPassword: string) {
  const passwordLength = trimmedPassword.length;
  if (!isPasswordLongEnough(trimmedPassword)) {
    throw new UserInputError(
      `Le mot de passe est trop court (Il fait ${passwordLength} caractères, le minimum est de ${minimalPasswordLength} caractères)`,
      {
        invalidArgs: ["newPassword"]
      }
    );
  }
  if (!isPasswordShortEnough(trimmedPassword)) {
    throw new UserInputError(
      `Le mot de passe est trop long.(Il fait ${passwordLength} caractères, le maximum est de ${maximalPasswordLength} caractères)`,
      {
        invalidArgs: ["newPassword"]
      }
    );
  }
  if (!isPasswordContainingAllCharClasses(trimmedPassword)) {
    throw new UserInputError(
      `Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre et un caractère spécial.`,
      {
        invalidArgs: ["newPassword"]
      }
    );
  }
  if (!isPasswordStrongEnough(trimmedPassword)) {
    throw new UserInputError(
      `Le mot de passe est trop simple, veuillez introduire plus de variété dans les caractères choisis.`,
      {
        invalidArgs: ["newPassword"]
      }
    );
  }
}

/**
 * Generates a cryptographically-sure random 12 characters password
 */
export function generatePassword(): string {
  const randomHex = crypto.randomBytes(8).toString("hex");
  return base32Encode(parseInt(randomHex, 16)).slice(-12).toLocaleLowerCase();
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
