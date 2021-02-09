import { hash } from "bcrypt";
import crypto from "crypto";
import * as yup from "yup";
import { base32Encode } from "../utils";
const saltRound = 10;

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
