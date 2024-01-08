import * as jose from "jose";
import {
  Grant,
  Application,
  User,
  CompanyVerificationStatus
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { EMAIL_SCOPE, PROFILE_SCOPE, COMPANIES_SCOPE } from "./scopes";

const { OIDC_PRIVATE_KEY } = process.env;

const TOKEN_SIGNATURE_ALG = "RS256";
const ISSUER = "trackdechets";

const getCompanies = async userId => {
  const associations = await prisma.companyAssociation.findMany({
    where: { userId },
    select: { role: true, company: true }
  });

  return associations.map(asso => ({
    id: asso.company.id,
    role: asso.role,
    siret: asso.company.siret,
    name: asso.company.name,
    given_name: asso.company.givenName,
    vat_number: asso.company.vatNumber,
    types: asso.company.companyTypes,
    verified:
      asso.company.verificationStatus === CompanyVerificationStatus.VERIFIED
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
  const privateKey = await jose.importPKCS8(
    OIDC_PRIVATE_KEY!,
    TOKEN_SIGNATURE_ALG
  );

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
    nonce: grant.nonce
  };

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: TOKEN_SIGNATURE_ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(grant.applicationId)
    .setExpirationTime("1h")
    .setSubject(grant.user.id)
    .sign(privateKey);

  return jwt;
};
