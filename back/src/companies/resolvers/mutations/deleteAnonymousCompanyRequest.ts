import * as yup from "yup";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { siret } from "../../../common/validation";

const validationSchema = yup.object({
  siret: siret.required()
});

const deleteAnonymousCompanyRequestResolver: MutationResolvers["deleteAnonymousCompanyRequest"] =
  async (_, { siret }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    // Yup validation
    await validationSchema.validate({ siret });

    // Delete the request
    // (deleteMany to avoid crash if record does not exist)
    await prisma.anonymousCompanyRequest.deleteMany({
      where: { siret }
    });

    return true;
  };

export default deleteAnonymousCompanyRequestResolver;
