import { isSiret } from "@td/constants";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";

export const anonymousCompanyRequestResolver: QueryResolvers["anonymousCompanyRequest"] =
  async (_, { siret }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    if (!isSiret(siret)) {
      throw new Error(`"${siret}" is not a valid SIRET`);
    }

    const anonymousCompanyRequest =
      await prisma.anonymousCompanyRequest.findFirst({
        where: { siret },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });

    return anonymousCompanyRequest;
  };

export default anonymousCompanyRequestResolver;
