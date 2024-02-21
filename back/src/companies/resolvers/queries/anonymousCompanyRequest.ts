import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";

export const anonymousCompanyRequestResolver: QueryResolvers["anonymousCompanyRequest"] =
  async (_, { id }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    const anonymousCompanyRequest =
      await prisma.anonymousCompanyRequest.findFirstOrThrow({
        where: { id }
      });

    return anonymousCompanyRequest;
  };

export default anonymousCompanyRequestResolver;
