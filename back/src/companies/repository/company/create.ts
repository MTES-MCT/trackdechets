import { Prisma, Company } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { getCompanySplittedAddress } from "../../companyUtils";

export type CreateCompanyFn = (
  data: Prisma.CompanyCreateInput,
  logMetadata?: LogMetadata
) => Promise<Company>;

export const buildCreateCompany = (deps: RepositoryFnDeps): CreateCompanyFn => {
  return async data => {
    const { prisma } = deps;

    const splittedAddress = await getCompanySplittedAddress(data as Company);

    const company = await prisma.company.create({
      data: {
        ...data,
        ...splittedAddress
      }
    });

    return company;
  };
};
