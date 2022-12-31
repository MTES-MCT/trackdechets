import { getUid } from "../utils";
import * as jose from "jose";
import { Grant, Application, User } from "@prisma/client";
import prisma from "../prisma";

import { EMAIL_SCOPE, PROFILE_SCOPE, COMPANIES_SCOPE } from "./scopes";

const TOKEN_SIGNATURE_ALG = "RS256";
const pkcs8 = process.env.OIDC_PRIVATE_KEY;

const ISSUER = "trackdechets";

const getCompanies = async userId => {
  const associations = await prisma.companyAssociation.findMany({
    where: { userId },
    select: { role: true, company: true }
  });

  return associations.map(asso => ({
    role: asso.role,
    siret: asso.company.siret,
    vat_number: asso.company.vatNumber
  }));
};

/**
 * Build a RSA-signed ID Token for OpenID Connect protocol
 * @param grant
 * @returns
 */
export const buildIdToken = async (
  grant: Grant & { application: Application; user: User }
): Promise<string> => {
  const privateKey = await jose.importPKCS8(pkcs8, TOKEN_SIGNATURE_ALG);

  // retrieve scopes and insert claims accordingly
  const profile = grant.scope.includes(PROFILE_SCOPE)
    ? { name: grant.user.name, phone: grant.user.phone ?? "" }
    : {};
  const email = grant.scope.includes(EMAIL_SCOPE)
    ? { email: grant.user.email, email_verified: grant.user.isActive }
    : {};

  const companies = grant.scope.includes(COMPANIES_SCOPE)
    ? { companies: await getCompanies(grant.user.id) }
    : {};
  const payload = {
    ...profile,
    ...email,
    ...companies,
    nonce: getUid(32)
  };

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: TOKEN_SIGNATURE_ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(grant.application.name)
    .setExpirationTime("1h")
    .setSubject(grant.user.id)
    .sign(privateKey);

  return jwt;
};
