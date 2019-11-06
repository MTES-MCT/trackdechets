import { verify } from "jsonwebtoken";
import { prisma } from "./generated/prisma-client";

const { JWT_SECRET } = process.env;

interface Token {
  userId: string;
}

/**
 * Parse token from a Bearer authorization header
 * @param auth
 */
export function parseBearerToken(authHeader: string): string {
  const parts = authHeader.split(" ");
  if (parts.length != 2) {
    // malformed header
    return null;
  }
  const scheme = parts[0];
  if (scheme.toLowerCase() !== "bearer") {
    return null;
  }

  const token = parts[1];
  return token;
}

/**
 * Decode the userId from the token
 * @param token
 */
export function getUserIdFromToken(token: string) {
  try {
    const decoded = verify(token, JWT_SECRET) as Token;
    return decoded.userId;
  } catch (err) {
    // Invalid or expired token
    return null;
  }
}

/**
 * Returns the authenticated user
 * @param request
 */
export function getUser(request) {
  const authHeader = request.get("Authorization");
  if (!!authHeader) {
    const token = parseBearerToken(authHeader);
    if (!!token) {
      const userId = getUserIdFromToken(token);
      if (!!userId) {
        return prisma.user({ id: userId });
      }
    }
  }
  return null;
}
