import { hash } from "bcrypt";

const saltRound = 10;

export function hashPassword(password: string) {
  return hash(password, saltRound);
}

export function generatePassword() {
  return Math.random().toString(36).slice(-10);
}
