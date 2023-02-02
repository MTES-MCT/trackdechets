import { User, Bsvhu, BsvhuStatus } from "@prisma/client";
import { NotFormContributor } from "../forms/errors";
import { getCachedUserSiretOrVat } from "../common/redis/users";
import { ForbiddenError } from "apollo-server-express";

export async function checkIsBsvhuContributor(
  user: User,
  form: Partial<
    Pick<
      Bsvhu,
      | "emitterCompanySiret"
      | "destinationCompanySiret"
      | "transporterCompanySiret"
      | "transporterCompanyVatNumber"
    >
  >,
  errorMsg: string
) {
  const isContributor = await isBsvhuContributor(user, form);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}

export async function isBsvhuContributor(user: User, form: Partial<Bsvhu>) {
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const bsvhuSiretsOrVat = [
    form.emitterCompanySiret,
    form.destinationCompanySiret,
    form.transporterCompanySiret,
    form.transporterCompanyVatNumber
  ];

  return userCompaniesSiretOrVat.some(siret =>
    bsvhuSiretsOrVat.includes(siret)
  );
}

export async function checkCanDeleteBsdvhu(user: User, bsvhu: Bsvhu) {
  await checkIsBsvhuContributor(
    user,
    bsvhu,
    "Vous n'êtes pas autorisé à supprimer ce bordereau."
  );

  const isUserOnlySignatory = async () =>
    bsvhu.status === BsvhuStatus.SIGNED_BY_PRODUCER &&
    (await getCachedUserSiretOrVat(user.id)).includes(
      bsvhu.emitterCompanySiret
    );

  if (bsvhu.status === BsvhuStatus.INITIAL || (await isUserOnlySignatory())) {
    return true;
  }

  throw new ForbiddenError(
    "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés"
  );

  return true;
}
