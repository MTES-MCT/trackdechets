import { Grant } from "@td/prisma";

/**
 * Check whether or not a grant has expired
 * @param grant
 */
export function isExpired(grant: Grant): boolean {
  const now = Date.now();
  const createdAt = new Date(grant.createdAt);
  const elapsed = (now - createdAt.getTime()) / 1000;
  return elapsed > grant.expires;
}
