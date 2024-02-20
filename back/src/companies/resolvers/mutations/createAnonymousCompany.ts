import * as yup from "yup";
import {
  AnonymousCompanyInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import {
  checkIsAdmin,
  checkIsAuthenticated
} from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { isForeignVat, nafCodes } from "@td/constants";
import { UserInputError } from "../../../common/errors";
import { libelleFromCodeNaf } from "../../sirene/utils";
import { anonymousCompanyInputSchema } from "./createAnonymousCompanyByAdmin";

const createAnonymousCompanyResolver: MutationResolvers["createAnonymousCompany"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAuthenticated(context);

    await anonymousCompanyInputSchema.validate(input);

    // ignore SIRET in this case
    if (isForeignVat(input.vatNumber)) {
      delete input.siret;
    }

    const existingAnonymousCompany = await prisma.anonymousCompany.findUnique({
      where: { orgId: input.siret ?? input.vatNumber! }
    });
    if (existingAnonymousCompany) {
      throw new UserInputError(
        `L'entreprise au SIRET "${input.siret}" est déjà connue de notre répertoire privé.`
      );
    }

    const anonymousCompany = await prisma.anonymousCompany.create({
      data: {
        orgId: input.siret ?? input.vatNumber!,
        ...input,
        libelleNaf: libelleFromCodeNaf(input.codeNaf)
      }
    });

    return anonymousCompany;
  };

export default createAnonymousCompanyResolver;
