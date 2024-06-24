import { CompanyDigestNotFound } from "./errors";

import { UserInputError } from "../common/errors";
import { prisma } from "@td/prisma";

import { CompanyDigest } from "@prisma/client";

/**
 * Retrieves a companyDigest by id or throw a CompanyDigestNotFound error
 */
export async function getCompanyDigestOrNotFound({
  id
}: {
  id: string;
}): Promise<CompanyDigest> {
  if (!id) {
    throw new UserInputError("You should specify an id");
  }
  const companyDigest = await prisma.companyDigest.findUnique({
    where: { id }
  });

  if (companyDigest == null) {
    throw new CompanyDigestNotFound(id.toString());
  }
  return companyDigest;
}
