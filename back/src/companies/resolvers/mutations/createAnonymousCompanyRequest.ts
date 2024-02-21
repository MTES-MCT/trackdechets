import { prisma } from "../../../../../libs/back/prisma/src";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { validateAndExtractSireneDataFromPDFInBase64 } from "./createAnonymousCompanyRequest.helpers";

const createAnonymousCompanyRequestResolver: MutationResolvers["createAnonymousCompanyRequest"] =
  async (_, { pdf }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    // Run verifications & extract data from PDF
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
    const request = await prisma.anonymousCompanyRequest.findFirst({
      where: {
        siret: data.siret
      }
    });
    if (request) {
      throw new Error(
        `Une demande pour l'entreprise ${data.siret} est déjà en cours`
      );
    }

    // Create the request
    await prisma.anonymousCompanyRequest.create({
      data: {
        ...data,
        userId: user.id,
        pdf
      }
    });

    return true;
  };

export default createAnonymousCompanyRequestResolver;
