import { applyAuthStrategies, AuthType } from "../../../auth";
import { isSiret, cleanClue as cleanClueFn } from "@td/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  CompanySearchPrivate,
  QueryResolvers
} from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
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
  return {
    ...(companyInfos as CompanySearchPrivate),
    ...{
      trackdechetsId: company?.id,
      orgId: company?.orgId ?? companyInfos.orgId,
      gerepId: company?.gerepId,
      securityCode: company?.securityCode,
      verificationCode: company?.verificationCode,
      givenName: company?.givenName
    },
    isAnonymousCompany: isAnonymousCompany > 0,
    receivedSignatureAutomations: []
  } as CompanySearchPrivate;
};

export default companyInfosResolvers;
