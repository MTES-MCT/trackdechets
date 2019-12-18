import { Context } from "../../types";
import { prisma, CompanyType } from "../../generated/prisma-client";

export type Paylod = {
  siret: string;
  gerepId?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  companyTypes?: CompanyType[];
};

export default function updateCompany({
  siret,
  companyTypes,
  gerepId,
  contactEmail,
  contactPhone,
  website
}: Paylod) {
  const data = {
    ...(companyTypes ? { companyTypes: { set: companyTypes } } : {}),
    ...(gerepId ? { gerepId } : {}),
    ...(contactEmail ? { contactEmail } : {}),
    ...(contactPhone ? { contactPhone } : {}),
    ...(website ? { website } : {})
  };

  return prisma.updateCompany({
    where: { siret },
    data
  });
}
