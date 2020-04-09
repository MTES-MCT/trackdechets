import { sendMail } from "../../common/mails.helper";
import { GraphQLContext } from "../../types";
import { randomNumber } from "../../utils";
import { UserInputError } from "apollo-server-express";
import { User, Company, prisma } from "../../generated/prisma-client";

export default async function createCompany(
  _,
  { companyInput },
  context: GraphQLContext
) {
  const trimedSiret = companyInput.siret.replace(/\s+/g, "");

  const existingCompany = await prisma.$exists
    .company({
      siret: trimedSiret
    })
    .catch(__ => {
      throw new Error(
        "Erreur lors de la vérification du SIRET. Merci de réessayer."
      );
    });

  if (existingCompany) {
    throw new UserInputError(
      `Cette entreprise existe déjà dans Trackdéchets. Contactez l'administrateur de votre entreprise afin qu'il puisse vous inviter à rejoindre l'organisation`
    );
  }

  const companyAssociationPromise = prisma.createCompanyAssociation({
    user: { connect: { id: context.user.id } },
    company: {
      create: {
        siret: trimedSiret,
        codeNaf: companyInput.codeNaf,
        gerepId: companyInput.gerepId,
        name: companyInput.companyName,
        companyTypes: { set: companyInput.companyTypes },
        securityCode: randomNumber(4)
      }
    },
    role: "ADMIN"
  });

  const company = await companyAssociationPromise.company();

  await warnIfUserCreatesTooManyCompanies(context.user, company);

  return company;
}

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
