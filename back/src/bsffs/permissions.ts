import { User, Bsff, BsffFicheIntervention } from "@prisma/client";
import { ForbiddenError } from "apollo-server-express";

import { checkIsCompanyMember } from "../users/permissions";
import { getCachedUserSirets } from "../common/redis/users";

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
  const userSirets = await getCachedUserSirets(user.id);

  const bsffSirets = [
    bsff.emitterCompanySiret,
    bsff.transporterCompanySiret,
    bsff.destinationCompanySiret
  ].filter(Boolean);

  const siretsInCommon = userSirets.filter(siret => bsffSirets.includes(siret));

  const count = siretsInCommon.length;

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
