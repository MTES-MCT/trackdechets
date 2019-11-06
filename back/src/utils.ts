import { verify } from "jsonwebtoken";
import { getCompanyUsers, getCompanyAdmins } from "./companies/helper";

const { JWT_SECRET } = process.env;

interface Token {
  userId: string;
}

interface Context {
  request: any;
}

/** DEPRECATED !
 * We should get userId directly from the context
 * => const userId = context.user.id
 * To be used in conjunction with permission isAuthenticated
 * to ensure user is not null
 */
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
  const basis = Math.pow(10, length - 1);
  return Math.floor(basis + Math.random() * 9 * basis);
}

/**
 * Merge a list of graphql-shield permissions
 * @param permissions
 */
export function mergePermissions(permissions) {
  const merge = (r1, r2) => {
    return {
      Query: { ...r1.Query, ...r2.Query },
      Mutation: { ...r1.Mutation, ...r2.Mutation }
    };
  };

  return permissions.reduce((prev, cur) => merge(prev, cur));
}
