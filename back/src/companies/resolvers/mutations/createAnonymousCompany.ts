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

const AnonymousCompanyInputSchema: yup.SchemaOf<AnonymousCompanyInput> = yup.object(
  {
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
    siret: yup.string().length(14).required()
  }
);

const createAnonymousCompanyResolver: MutationResolvers["createAnonymousCompany"] = async (
  parent,
  { input },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  await AnonymousCompanyInputSchema.validate(input);

  const existingAnonymousCompany = await prisma.anonymousCompany.findUnique({
    where: { siret: input.siret }
  });
  if (existingAnonymousCompany) {
    throw new UserInputError(
      `L'entreprise au SIRET "${input.siret}" est déjà connue de notre répertoire privé.`
    );
  }

  const anonymousCompany = await prisma.anonymousCompany.create({
    data: {
      ...input,
      libelleNaf: nafCodes[input.codeNaf]
    }
  });

  return anonymousCompany;
};

export default createAnonymousCompanyResolver;
