import { User, Bsff, BsffFicheIntervention, Prisma } from "@prisma/client";
import { ForbiddenError } from "apollo-server-express";
import { getCachedUserSiretOrVat } from "../common/redis/users";

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
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const bsffSirets = [
    bsff.emitterCompanySiret,
    bsff.transporterCompanySiret,
    bsff.destinationCompanySiret
  ].filter(Boolean);

  return userCompaniesSiretOrVat.some(siret => bsffSirets.includes(siret));
}

export async function isFicheInterventionOperateur(
  user: User,
  ficheIntervention: Pick<BsffFicheIntervention, "operateurCompanySiret">
) {
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const ficheInterventionsSirets = [
    ficheIntervention.operateurCompanySiret
  ].filter(Boolean);

  return userCompaniesSiretOrVat.some(siret =>
    ficheInterventionsSirets.includes(siret)
  );
}

export async function isFicheInterventionDetenteur(
  user: User,
  ficheIntervention: Pick<BsffFicheIntervention, "detenteurCompanySiret">
) {
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const ficheInterventionsSirets = [
    ficheIntervention.detenteurCompanySiret
  ].filter(Boolean);

  return userCompaniesSiretOrVat.some(siret =>
    ficheInterventionsSirets.includes(siret)
  );
}

export async function isBsffDetenteur(user: User, bsff: Bsff) {
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  return userCompaniesSiretOrVat.some(siret =>
    bsff.detenteurCompanySirets.includes(siret)
  );
}

export async function checkCanWriteBsff(
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
  const isContributor = await isBsffContributor(user, bsff);

  if (!isContributor) {
    throw new ForbiddenError(
      "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
    );
  }

  return isContributor;
}

export async function checkCanReadBsff(user: User, bsff: Bsff) {
  const isContributor = await isBsffContributor(user, bsff);
  const isDetenteur = await isBsffDetenteur(user, bsff);

  if (!isContributor && !isDetenteur) {
    throw new ForbiddenError("Vous ne pouvez pas accéder à ce BSFF");
  }

  return true;
}

export async function checkCanWriteFicheIntervention(
  user: User,
  ficheIntervention:
    | BsffFicheIntervention
    | Prisma.BsffFicheInterventionCreateInput
) {
  const isOperateur = await isFicheInterventionOperateur(
    user,
    ficheIntervention
  );

  if (!isOperateur) {
    throw new ForbiddenError(
      "Vous ne pouvez pas éditer une fiche d'intervention sur lequel le SIRET de votre entreprise n'apparaît pas."
    );
  }

  return isOperateur;
}
