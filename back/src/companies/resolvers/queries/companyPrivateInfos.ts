import { applyAuthStrategies, AuthType } from "../../../auth";
import {
  isSiret,
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
  const where = isSiret(cleanClue)
    ? { siret: cleanClue }
    : { vatNumber: cleanClue };

  const [companyInfos, isAnonymousCompany, company] = await Promise.all([
    getCompanyInfos(cleanClue),
    prisma.anonymousCompany.count({
      where: { siret: cleanClue }
    }),
    prisma.company.findUnique({
      where,
      select: {
        id: true,
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
    ...{
      trackdechetsId: company?.id,
      orgId: company?.orgId,
      gerepId: company?.gerepId,
      securityCode: company?.securityCode,
      verificationCode: company?.verificationCode,
      givenName: company?.givenName
    },
    // We don't need this infos in this query
    isAnonymousCompany: isAnonymousCompany > 0
  } as CompanySearchPrivate;
};

export default companyInfosResolvers;
