import * as yup from "yup";
import {
  AnonymousCompanyInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import prisma from "../../../prisma";
import { nafCodes } from "shared/constants";
import { isForeignVat } from "shared/constants";
import {
  foreignVatNumber,
  siret,
  siretConditions
} from "../../../common/validation";
import { UserInputError } from "../../../common/errors";
import { libelleFromCodeNaf } from "../../sirene/utils";

const anonymousCompanyInputSchema: yup.SchemaOf<AnonymousCompanyInput> =
  yup.object({
    address: yup.string().required(),
    codeCommune: yup.string().required(),
    codeNaf: yup
      .string()
      .oneOf(
        Object.keys(nafCodes),
        "Le code NAF ne fait pas partie de la liste reconnue."
      )
      .required(),
    name: yup.string().required(),
    vatNumber: foreignVatNumber,

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
