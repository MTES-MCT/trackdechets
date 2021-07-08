import { User, Bsvhu, BsvhuStatus } from "@prisma/client";
import { NotFormContributor } from "../forms/errors";
import { getFullUser } from "../users/database";
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
  const fullUser = await getFullUser(user);
  const userSirets = fullUser.companies.map(c => c.siret);

  const formSirets = [
    form.emitterCompanySiret,
    form.destinationCompanySiret,
    form.transporterCompanySiret
  ];

  const siretsInCommon = userSirets.filter(siret => formSirets.includes(siret));

  return siretsInCommon.length;
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
