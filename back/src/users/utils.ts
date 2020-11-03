import { hash } from "bcrypt";
import * as yup from "yup";

const saltRound = 10;

export function hashPassword(password: string) {
  return hash(password, saltRound);
}

export function generatePassword() {
  return Math.random().toString(36).slice(-10);
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
