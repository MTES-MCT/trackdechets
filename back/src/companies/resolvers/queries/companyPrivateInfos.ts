import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  CompanySearchPrivate,
  QueryResolvers
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getCompanyInfos } from "./companyInfos";

const companyInfosResolvers: QueryResolvers["companyPrivateInfos"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);
  const cleanClue = args.clue.replace(/\s/g, "").toUpperCase();
  const [companyInfos, isAnonymousCompany] = await Promise.all([
    getCompanyInfos(cleanClue),
    prisma.anonymousCompany.count({
      where: { siret: cleanClue }
    })
  ]);

  return {
    ...companyInfos,
    // We don't need this infos in this query
    isAnonymousCompany: isAnonymousCompany > 0
  } as CompanySearchPrivate;
};

export default companyInfosResolvers;
