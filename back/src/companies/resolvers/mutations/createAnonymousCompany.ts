import * as yup from "yup";
import {
  AnonymousCompanyInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { nafCodes } from "@td/constants";
import { siret } from "../../../common/validation";
import { UserInputError } from "../../../common/errors";
import { libelleFromCodeNaf } from "../../sirene/utils";
import {
  renderMail,
  anonymousCompanyCreatedEmail
} from "../../../../../libs/back/mail/src";
import { sendMail } from "../../../mailer/mailing";

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
    siret: siret.required()
  });

const createAnonymousCompanyResolver: MutationResolvers["createAnonymousCompany"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAdmin(context);

    await anonymousCompanyInputSchema.validate(input);

    const existingAnonymousCompany = await prisma.anonymousCompany.findUnique({
      where: { orgId: input.siret }
    });
    if (existingAnonymousCompany) {
      throw new UserInputError(
        `L'entreprise au SIRET "${input.siret}" est déjà connue de notre répertoire privé.`
      );
    }

    const anonymousCompany = await prisma.anonymousCompany.create({
      data: {
        orgId: input.siret,
        ...input,
        libelleNaf: libelleFromCodeNaf(input.codeNaf)
      }
    });

    // If there was an anonymousCompanyRequest associated, delete it and warn the user
    try {
      const request = await prisma.anonymousCompanyRequest.delete({
        where: {
          siret: input.siret
        }
      });

      if (request) {
        // Send an email to the user
        const user = await prisma.user.findFirst({
          where: {
            id: request.userId
          }
        });

        if (user) {
          await sendMail(
            renderMail(anonymousCompanyCreatedEmail, {
              to: [{ name: user.name ?? "", email: user.email }],
              variables: { siret: input.siret }
            })
          );
        }
      }
    } catch (e) {
      // Request wasn't found - do nothing
      // https://github.com/prisma/prisma/issues/4072
    }

    return anonymousCompany;
  };

export default createAnonymousCompanyResolver;
