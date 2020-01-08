import { prisma, CompanyType } from "../../generated/prisma-client";

export type Payload = {
  siret: string;
  gerepId?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  companyTypes?: CompanyType[];
  givenName?: string;
};

export default function updateCompany({
  siret,
  companyTypes,
  gerepId,
  contactEmail,
  contactPhone,
  website,
  givenName
}: Payload) {
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
