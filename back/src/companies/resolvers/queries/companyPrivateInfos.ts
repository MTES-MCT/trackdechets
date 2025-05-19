import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { isSiret, cleanClue as cleanClueFn } from "@td/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getUserRoles } from "../../../permissions";
import type { CompanySearchPrivate, QueryResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { getCompanyInfos } from "./companyInfos";

const companyPrivateInfosResolvers: QueryResolvers["companyPrivateInfos"] =
  async (_, args, context) => {
    // Warning: this query could expose sensitive informations if not handled properly,
    //double check the returned data and subresolvers (CompanySearchPrivate)
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const roles = await getUserRoles(user.id);

    const userCompanies = Object.keys(roles);

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
          givenName: true,
          verificationStatus: true
        }
      })
    ]);

    const userBelongsToCompany = userCompanies.includes(company?.orgId ?? "");

    return {
      ...(companyInfos as CompanySearchPrivate),
      ...{
        trackdechetsId: company?.id,
        orgId: company?.orgId ?? companyInfos.orgId,
        gerepId: company?.gerepId,
        securityCode: userBelongsToCompany ? company?.securityCode : null,
        verificationCode: company?.verificationCode,
        givenName: company?.givenName,
        verificationStatus: company?.verificationStatus
      },
      isAnonymousCompany: isAnonymousCompany > 0,
      receivedSignatureAutomations: []
    } as CompanySearchPrivate;
  };

export default companyPrivateInfosResolvers;
