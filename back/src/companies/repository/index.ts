import { transactionWrapper } from "../../common/repository/helper";
import { CompanyActions } from "./types";
import { UpdateCompanyFn, buildUpdateCompany } from "./company/update";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";
import { buildCreateCompany, CreateCompanyFn } from "./company/create";

export type CompanyRepository = CompanyActions;

export function getCompanyRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): CompanyRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }
  return {
    updateCompany: useTransaction(buildUpdateCompany) as UpdateCompanyFn,
    createCompany: useTransaction(buildCreateCompany) as CreateCompanyFn
  };
}
