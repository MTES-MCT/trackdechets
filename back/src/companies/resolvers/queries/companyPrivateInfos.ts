import { applyAuthStrategies, AuthType } from "../../../auth";
import {
  isSiret,
  isVat,
  cleanClue as cleanClueFn
} from "../../../common/constants/companySearchHelpers";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  CompanySearchPrivate,
  QueryResolvers
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getCompanyInfos } from "./companyInfos";

const companyInfosResolvers: QueryResolvers["companyPrivateInfos"] = async (
  _,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);

  const cleanClue = cleanClueFn(args.clue);
  const [companyInfos, isAnonymousCompany, company] = await Promise.all([
    getCompanyInfos(cleanClue),
    prisma.anonymousCompany.count({
      where: { siret: cleanClue }
    }),
    prisma.company.findUnique({
      where: {
        ...(isSiret(cleanClue) && { siret: cleanClue }),
        ...(isVat(cleanClue) && { vatNumber: cleanClue })
      },
      select: {
        orgId: true,
        gerepId: true,
        securityCode: true,
        verificationCode: true,
        givenName: true
      }
    })
  ]);
  const companyInfosConvert: any = companyInfos;
  return {
    ...companyInfosConvert,
    ...company,
    // We don't need this infos in this query
    isAnonymousCompany: isAnonymousCompany > 0
  } as CompanySearchPrivate;
};

export default companyInfosResolvers;
