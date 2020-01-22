import { DomainError, ErrorCode } from "../../common/errors";
import { Context } from "../../types";
import { randomNumber } from "../../utils";

export default async function createCompany(_, { companyInput }, context: Context) {
  const trimedSiret = companyInput.siret.replace(/\s+/g, "");

  const existingCompany = await context.prisma.$exists
    .company({
      siret: trimedSiret
    })
    .catch(_ => {
      throw new Error(
        "Erreur lors de la vérification du SIRET. Merci de réessayer."
      );
    });

  if (existingCompany) {
    throw new DomainError(
      `Cette entreprise existe déjà dans Trackdéchets. Contactez l'administrateur de votre entreprise afin qu'il puisse vous inviter à rejoindre l'organisation`,
      ErrorCode.BAD_USER_INPUT
    );
  }

  const company = await context.prisma
    .createCompany({
      siret: trimedSiret,
      codeNaf: companyInput.codeNaf,
      gerepId: companyInput.gerepId,
      name: companyInput.companyName,
      companyTypes: { set: companyInput.companyTypes },
      securityCode: randomNumber(4)
    })
    .catch(_ => {
      throw new Error(
        "Impossible de créer cet utilisateur. Veuillez contacter le support."
      );
    });

  await context.prisma.createCompanyAssociation({
    user: { connect: { id: context.user.id } },
    company: { connect: { id: company.id } },
    role: "ADMIN"
  });

  return company;
}
