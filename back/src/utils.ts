import { verify } from "jsonwebtoken";

const { JWT_SECRET } = process.env;

interface Token {
  userId: string;
}

export function getUserIdFromToken(token: string) {
  const verifiedToken = verify(token, JWT_SECRET) as Token;
  return verifiedToken && verifiedToken.userId;
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
