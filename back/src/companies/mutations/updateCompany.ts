import { Context } from "../../types";
import { CompanyType } from "../../generated/prisma-client";

type Paylod = {
  siret: string;
  companyTypes: CompanyType[];
};

export default function updateCompany(
  _,
  { siret, companyTypes }: Paylod,
  context: Context
) {
  return context.prisma.updateCompany({
    where: { siret },
    data: { companyTypes: { set: companyTypes } }
  });
}
