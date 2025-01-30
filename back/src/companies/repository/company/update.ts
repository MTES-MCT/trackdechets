import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { isDefined } from "../../../common/helpers";

export type UpdateCompanyFn = <Args extends Prisma.CompanyUpdateArgs>(
  args: Args,
  logMetadata?: LogMetadata
) => Promise<Prisma.CompanyGetPayload<Args>>;

export function buildUpdateCompany(deps: RepositoryFnDeps): UpdateCompanyFn {
  return async <Args extends Prisma.CompanyUpdateArgs>(args: Args) => {
    const { prisma } = deps;

    const updatedCompany = await prisma.company.update(args);

    // User is changing the adress! We need to update 
    // the splitted adress fields
    if(isDefined(args.data.address)){
        // TODO
    }

    return updatedCompany as Prisma.CompanyGetPayload<Args>;
  };
}
