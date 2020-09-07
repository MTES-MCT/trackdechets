import { sendMail } from "../../../common/mails.helper";
import { randomNumber } from "../../../utils";
import { UserInputError } from "apollo-server-express";
import {
  User,
  Company,
  CompanyCreateInput,
  prisma
} from "../../../generated/prisma-client";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";

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
    siret,
    codeNaf,
    gerepId,
    companyName: name,
    companyTypes,
    transporterReceiptId,
    traderReceiptId,
    documentKeys
  } = companyInput;

  const trimedSiret = siret.replace(/\s+/g, "");

  const existingCompany = await prisma.$exists
    .company({
      siret: trimedSiret
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

  const companyCreateInput: CompanyCreateInput = {
    siret: trimedSiret,
    codeNaf,
    gerepId,
    name,
    companyTypes: { set: companyTypes },
    securityCode: randomNumber(4)
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

  if (!!documentKeys && documentKeys.length >= 1) {
    companyCreateInput.documentKeys = {
      set: documentKeys
    };
  }

  const companyAssociationPromise = prisma.createCompanyAssociation({
    user: { connect: { id: user.id } },
    company: {
      create: companyCreateInput
    },
    role: "ADMIN"
  });

  const company = await companyAssociationPromise.company();

  await warnIfUserCreatesTooManyCompanies(user, company);

  return company;
};

const NB_OF_COMPANIES_BEFORE_ALERT = 5;

export async function warnIfUserCreatesTooManyCompanies(
  user: User,
  company: Company
) {
  const userCompaniesNumber = await prisma
    .companyAssociationsConnection({ where: { user: { id: user.id } } })
    .aggregate()
    .count();

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
