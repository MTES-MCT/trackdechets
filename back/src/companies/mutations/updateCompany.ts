import { Context } from "../../types";
import { CompanyType } from "../../generated/prisma-client";

type Paylod = {
  siret: string;
  gerepId?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  companyTypes?: CompanyType[];
};

export default function updateCompany(
  _,
  { siret, companyTypes, gerepId, contactEmail, contactPhone, website }: Paylod,
  context: Context
) {
  const data = {
    ...(companyTypes ? { companyTypes: { set: companyTypes } } : {}),
    ...(gerepId ? { gerepId } : {}),
    ...(contactEmail ? { contactEmail } : {}),
    ...(contactPhone ? { contactPhone } : {}),
    ...(website ? { website } : {})
  };
  return context.prisma.updateCompany({
    where: { siret },
    data
  });
}
