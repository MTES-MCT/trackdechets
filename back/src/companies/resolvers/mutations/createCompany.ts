import { Company, Prisma, User } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { convertUrls } from "../../database";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { randomNumber } from "../../../utils";
import geocode from "../../geocode";

/**
 * Create a new company and associate it to a user
 * who becomes the first admin of the company
 * @param companyInput
 * @param userId
 */

const createCompanyResolver: MutationResolvers["createCompany"] = async (
  parent,
  { companyInput },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const {
    codeNaf,
    gerepId,
    companyName: name,
    givenName,
    address,
    companyTypes,
    transporterReceiptId,
    traderReceiptId
  } = companyInput;
  const ecoOrganismeAgreements =
    companyInput.ecoOrganismeAgreements?.map(a => a.href) || [];
  const siret = companyInput.siret.replace(/\s+/g, "");

  const existingCompany = await prisma.company
    .findUnique({
      where: {
        siret
      }
    })
    .catch(() => {
      throw new Error(
        "Erreur lors de la vérification du SIRET. Merci de réessayer."
      );
    });

  if (existingCompany) {
    throw new UserInputError(
      `Cette entreprise existe déjà dans Trackdéchets. Contactez l'administrateur de votre entreprise afin qu'il puisse vous inviter à rejoindre l'organisation`
    );
  }

  if (companyTypes.includes("ECO_ORGANISME")) {
    const ecoOrganismeExists = await prisma.ecoOrganisme.findUnique({
      where: { siret }
    });
    if (!ecoOrganismeExists) {
      throw new UserInputError(
        "Cette entreprise ne fait pas partie de la liste des éco-organismes reconnus par Trackdéchets. Contactez-nous si vous pensez qu'il s'agit d'une erreur : hello@trackdechets.beta.gouv.fr"
      );
    }

    if (ecoOrganismeAgreements.length < 1) {
      throw new UserInputError(
        "L'URL de l'agrément de l'éco-organisme est requis."
      );
    }
  } else if (ecoOrganismeAgreements.length > 0) {
    throw new UserInputError(
      "Impossible de lier des agréments d'éco-organisme : l'entreprise n'est pas un éco-organisme."
    );
  }

  const { latitude, longitude } = await geocode(address);

  const companyCreateInput: Prisma.CompanyCreateInput = {
    siret,
    codeNaf,
    gerepId,
    name,
    givenName,
    address,
    latitude,
    longitude,
    companyTypes: { set: companyTypes },
    securityCode: randomNumber(4),
    ecoOrganismeAgreements: {
      set: ecoOrganismeAgreements
    }
  };

  if (!!transporterReceiptId) {
    companyCreateInput.transporterReceipt = {
      connect: { id: transporterReceiptId }
    };
  }

  if (!!traderReceiptId) {
    companyCreateInput.traderReceipt = {
      connect: { id: traderReceiptId }
    };
  }

  const companyAssociationPromise = prisma.companyAssociation.create({
    data: {
      user: { connect: { id: user.id } },
      company: {
        create: companyCreateInput
      },
      role: "ADMIN"
    }
  });

  const company = await companyAssociationPromise.company();

  // fill associatedAt field if null (no need to update it if user was previously already associated)
  await prisma.user.updateMany({
    where: { id: user.id, associatedAt: null },
    data: { associatedAt: new Date() }
  });
  await warnIfUserCreatesTooManyCompanies(user, company);

  return convertUrls(company);
};

const NB_OF_COMPANIES_BEFORE_ALERT = 5;

export async function warnIfUserCreatesTooManyCompanies(
  user: User,
  company: Company
) {
  const userCompaniesNumber = await prisma.companyAssociation.count({
    where: { user: { id: user.id } }
  });

  if (userCompaniesNumber > NB_OF_COMPANIES_BEFORE_ALERT) {
    return sendMail({
      body: `L'utilisateur ${user.name} (${user.id}) vient de créer sa ${userCompaniesNumber}ème entreprise: ${company.name} - ${company.siret}. A surveiller !`,
      subject:
        "Alerte: Grand mombre de compagnies créées par un même utilisateur",
      title:
        "Alerte: Grand mombre de compagnies créées par un même utilisateur",
      to: [
        {
          email: "tech@trackdechets.beta.gouv.fr ",
          name: "Equipe Trackdéchets"
        }
      ]
    });
  }

  return Promise.resolve();
}

export default createCompanyResolver;
