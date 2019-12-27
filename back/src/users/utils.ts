import { hash } from "bcrypt";

const saltRound = 10;

export function hashPassword(password: string) {
  return hash(password, saltRound);
}
