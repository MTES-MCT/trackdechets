import { Context } from "../../types";
import { CompanyType } from "../../generated/prisma-client";

type Paylod = {
  siret: string;
  gerepId?: string;
  companyTypes?: CompanyType[];
};

export default function updateCompany(
  _,
  { siret, companyTypes, gerepId }: Paylod,
  context: Context
) {
  const data = {
    ...(companyTypes ? { companyTypes: { set: companyTypes } } : {}),
    ...(gerepId ? { gerepId } : {})
  };
  return context.prisma.updateCompany({
    where: { siret },
    data
  });
}
