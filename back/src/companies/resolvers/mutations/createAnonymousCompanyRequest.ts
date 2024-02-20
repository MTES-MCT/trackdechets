import { prisma } from "../../../../../libs/back/prisma/src";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { validateAndExtractSireneDataFromPDFInBase64 } from "./createAnonymousCompanyRequest.helpers";

const createAnonymousCompanyRequestResolver: MutationResolvers["createAnonymousCompanyRequest"] =
  async (_, { pdf }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAuthenticated(context);

    const data = await validateAndExtractSireneDataFromPDFInBase64(pdf);

    // Verify company is not already created
    const anonymousCompany = await prisma.anonymousCompany.findFirst({
      where: {
        orgId: data.siret
      }
    });
    const company = await prisma.company.findFirst({
      where: {
        orgId: data.siret
      }
    });
    if (anonymousCompany || company) {
      throw new Error(`L'entreprise avec le SIRET ${data.siret} existe déjà`);
    }

    // Verify creation request does not already exist

    return true;
  };

export default createAnonymousCompanyRequestResolver;
