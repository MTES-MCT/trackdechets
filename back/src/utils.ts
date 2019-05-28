import { verify } from "jsonwebtoken";
import { getCompanyUsers, getCompanyAdmins } from "./companies/helper";

const { JWT_SECRET } = process.env;

interface Token {
  userId: string;
}

interface Context {
  request: any;
}

export function getUserId(context: Context) {
  const Authorization = context.request.get("Authorization");
  if (Authorization) {
    const token = Authorization.replace("Bearer ", "");
    return getUserIdFromToken(token);
  }
}

export function getUserIdFromToken(token: string) {
  const verifiedToken = verify(token, JWT_SECRET) as Token;
  return verifiedToken && verifiedToken.userId;
}

export async function currentUserBelongsToCompany(
  context: Context,
  siret: string
) {
  const companyUsers = await getCompanyUsers(siret);

  const currentUserId = getUserId(context);
  return !!companyUsers.find(a => a.id === currentUserId);
}

export async function currentUserBelongsToCompanyAdmins(
  context: Context,
  siret: string
) {
  const companyAdmins = await getCompanyAdmins(siret);

  const currentUserId = getUserId(context);
  return !!companyAdmins.find(a => a.id === currentUserId);
}

export function randomNumber(length: number = 4) {
  const basis = Math.pow(10, length - 1)
  return Math.floor(basis + Math.random() * 9 * basis)
}

export const merge = (target, source) => {
  for (let key of Object.keys(source)) {
    if (source[key] instanceof Object)
      Object.assign(source[key], merge(target[key], source[key]));
  }

  Object.assign(target || {}, source);
  return target;
};
