import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { isDefined } from "../../../common/helpers";
import { getCompanySplittedAddress } from "../../companyUtils";

export type UpdateCompanyFn = <Args extends Prisma.CompanyUpdateArgs>(
  args: Args,
  logMetadata?: LogMetadata
) => Promise<Prisma.CompanyGetPayload<Args>>;

export function buildUpdateCompany(deps: RepositoryFnDeps): UpdateCompanyFn {
  return async <Args extends Prisma.CompanyUpdateArgs>(args: Args) => {
    const { prisma } = deps;

    // Update the company
    let updatedCompany = await prisma.company.update(args);

    // User is changing the address! We need to update the splitted adress fields
    if (isDefined(args.data.address)) {
      const splittedAddress = await getCompanySplittedAddress(updatedCompany);

      updatedCompany = await prisma.company.update({
        where: { id: updatedCompany.id },
        data: splittedAddress
      });
    }

    return updatedCompany as Prisma.CompanyGetPayload<Args>;
  };
}
