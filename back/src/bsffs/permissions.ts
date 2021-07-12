import { User, Bsff, BsffFicheIntervention } from "@prisma/client";
import { ForbiddenError } from "apollo-server-express";
import prisma from "../prisma";
import { checkIsCompanyMember } from "../users/permissions";

export async function isBsffContributor(
  user: User,
  bsff: Partial<
    Pick<
      Bsff,
      | "emitterCompanySiret"
      | "transporterCompanySiret"
      | "destinationCompanySiret"
    >
  >
) {
  const count = await prisma.companyAssociation.count({
    where: {
      userId: user.id,
      company: {
        siret: {
          in: [
            bsff.emitterCompanySiret,
            bsff.transporterCompanySiret,
            bsff.destinationCompanySiret
          ].filter(Boolean)
        }
      }
    }
  });

  if (count <= 0) {
    throw new ForbiddenError(
      "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
    );
  }
}

export async function isFicheInterventionOperateur(
  user: User,
  ficheIntervention: Pick<BsffFicheIntervention, "operateurCompanySiret">
) {
  try {
    await checkIsCompanyMember(
      { id: user.id },
      { siret: ficheIntervention.operateurCompanySiret }
    );
  } catch {
    throw new ForbiddenError(
      `Vous devez être membre de l'entreprise au SIRET ${ficheIntervention.operateurCompanySiret} pour pouvoir éditer une fiche d'intervention en son nom.`
    );
  }
}
