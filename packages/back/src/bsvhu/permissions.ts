import { User, Bsvhu, BsvhuStatus } from "@prisma/client";
import { NotFormContributor } from "../forms/errors";
import { getCachedUserSirets } from "../common/redis/users";

import { ForbiddenError } from "apollo-server-express";
export async function checkIsFormContributor(
  user: User,
  form: Partial<
    Pick<
      Bsvhu,
      | "emitterCompanySiret"
      | "destinationCompanySiret"
      | "transporterCompanySiret"
    >
  >,
  errorMsg: string
) {
  const isContributor = await isFormContributor(user, form);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}

export async function isFormContributor(user: User, form: Partial<Bsvhu>) {
  const userSirets = await getCachedUserSirets(user.id);

  const formSirets = [
    form.emitterCompanySiret,
    form.destinationCompanySiret,
    form.transporterCompanySiret
  ];

  return userSirets.some(siret => formSirets.includes(siret));
}

export async function checkCanDeleteBsdvhu(user: User, form: Bsvhu) {
  await checkIsFormContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à supprimer ce bordereau."
  );

  if (form.status !== BsvhuStatus.INITIAL) {
    throw new ForbiddenError(
      "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés"
    );
  }

  return true;
}
