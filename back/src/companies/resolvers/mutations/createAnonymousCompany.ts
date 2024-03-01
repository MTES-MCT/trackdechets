import * as yup from "yup";
import {
  AnonymousCompanyInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { nafCodes, isForeignVat } from "@td/constants";
import { UserInputError } from "../../../common/errors";
import { libelleFromCodeNaf } from "../../sirene/utils";
import { renderMail, anonymousCompanyCreatedEmail } from "@td/mail";
import { sendMail } from "../../../mailer/mailing";
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
        libelleNaf: libelleFromCodeNaf(input.codeNaf)
      }
    });

    // If there was an anonymousCompanyRequest associated, delete it and warn the user
    if (input.siret) {
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
    }

    return anonymousCompany;
  };

export default createAnonymousCompanyResolver;
