import * as yup from "yup";
import { UserInputError } from "apollo-server-express";
import {
  AnonymousCompanyInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import prisma from "../../../prisma";
import { nafCodes } from "../../../common/constants/NAF";
import {
  isFRVat,
  isSiret,
  isVat
} from "../../../common/constants/companySearchHelpers";

const AnonymousCompanyInputSchema: yup.SchemaOf<AnonymousCompanyInput> =
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
    vatNumber: yup
      .string()
      .ensure()
      .test(
        "is-vat",
        "AnonymousCompany: ${originalValue} n'est pas un numéro de TVA valide",
        value => !value || isVat(value)
      )
      .test(
        "is-not-fr-vat",
        "AnonymousCompany: le numéro de SIRET est obligatoire pour les établissements français",
        value => !value || !isFRVat(value)
      ),
    siret: yup
      .string()
      .when("vatNumber", {
        is: vatNumber => !vatNumber,
        then: schema =>
          schema.required(
            "La sélection d'une entreprise par SIRET ou numéro de TVA (si l'entreprise n'est pas française) est obligatoire"
          ),
        otherwise: schema => schema.ensure()
      })
      .test(
        "is-siret",
        "AnonymousCompany: ${originalValue} n'est pas un numéro de SIRET valide",
        value => !value || isSiret(value)
      )
  });

const createAnonymousCompanyResolver: MutationResolvers["createAnonymousCompany"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    await AnonymousCompanyInputSchema.validate(input);

    const existingAnonymousCompany = await prisma.anonymousCompany.findUnique({
      where: { orgId: input.siret ?? input.vatNumber }
    });
    if (existingAnonymousCompany) {
      throw new UserInputError(
        `L'entreprise au SIRET "${input.siret}" est déjà connue de notre répertoire privé.`
      );
    }

    const anonymousCompany = await prisma.anonymousCompany.create({
      data: {
        orgId: input.siret ?? input.vatNumber,
        ...input,
        libelleNaf: nafCodes[input.codeNaf]
      }
    });

    return anonymousCompany;
  };

export default createAnonymousCompanyResolver;
