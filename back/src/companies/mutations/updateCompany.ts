import { prisma } from "../../generated/prisma-client";
import {
  MutationUpdateCompanyArgs,
  CompanyPrivate
} from "../../generated/graphql/types";

export default async function updateCompany({
  siret,
  companyTypes,
  gerepId,
  contactEmail,
  contactPhone,
  website,
  givenName
}: MutationUpdateCompanyArgs): Promise<CompanyPrivate> {
  const data = {
    ...(companyTypes !== undefined
      ? { companyTypes: { set: companyTypes } }
      : {}),
    ...(gerepId !== undefined ? { gerepId } : {}),
    ...(contactEmail !== undefined ? { contactEmail } : {}),
    ...(contactPhone !== undefined ? { contactPhone } : {}),
    ...(website !== undefined ? { website } : {}),
    ...(givenName !== undefined ? { givenName } : {})
  };

  return prisma.updateCompany({
    where: { siret },
    data
  });
}
