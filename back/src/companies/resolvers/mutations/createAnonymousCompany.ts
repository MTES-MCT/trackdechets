import * as yup from "yup";
import type {
  AnonymousCompanyInput,
  MutationResolvers
} from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAdmin } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { nafCodes } from "@td/constants";
import { UserInputError } from "../../../common/errors";
import { libelleFromCodeNaf } from "../../sirene/utils";
import {
  foreignVatNumber,
  siret,
  siretConditions
} from "../../../common/validation";

const anonymousCompanyInputSchema: yup.SchemaOf<AnonymousCompanyInput> =
  yup.object({
    address: yup.string().required(),
    codeCommune: yup.string().required(),
    vatNumber: foreignVatNumber,
    codeNaf: yup
      .string()
      .oneOf(
        Object.keys(nafCodes),
        "Le code NAF ne fait pas partie de la liste reconnue."
      )
      .required(),
    name: yup.string().required(),
    siret: siret
      .required(
        "La sélection d'une entreprise par SIRET ou numéro de TVA (si l'entreprise n'est pas française) est obligatoire"
      )
      .when("vatNumber", siretConditions.companyVatNumber as any)
  });

const createAnonymousCompanyResolver: MutationResolvers["createAnonymousCompany"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    await anonymousCompanyInputSchema.validate(input);

    if (Boolean(input.siret) && Boolean(input.vatNumber)) {
      throw new UserInputError(
        `Vous ne pouvez pas préciser un numéro de TVA ET un SIRET: les deux champs sont mutuellement exclusifs`
      );
    }

    const orgId = Boolean(input.siret) ? input.siret! : input.vatNumber!;

    const existingAnonymousCompany = await prisma.anonymousCompany.findUnique({
      where: { orgId }
    });
    if (existingAnonymousCompany) {
      throw new UserInputError(
        `L'entreprise "${orgId}" est déjà connue de notre répertoire privé.`
      );
    }

    const anonymousCompany = await prisma.anonymousCompany.create({
      data: {
        orgId,
        ...input,
        vatNumber: input.vatNumber || null, // Get rid of empty string
        libelleNaf: libelleFromCodeNaf(input.codeNaf)
      }
    });

    return anonymousCompany;
  };

export default createAnonymousCompanyResolver;
