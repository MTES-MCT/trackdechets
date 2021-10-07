import { Bsda, BsdaStatus, User } from "@prisma/client";
import { ForbiddenError } from "apollo-server-express";
import { NotFormContributor } from "../forms/errors";
import { getFullUser } from "../users/database";

export async function checkIsFormContributor(
  user: User,
  form: Partial<
    Pick<
      Bsda,
      | "emitterCompanySiret"
      | "destinationCompanySiret"
      | "transporterCompanySiret"
      | "workerCompanySiret"
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

export async function isFormContributor(user: User, form: Partial<Bsda>) {
  const fullUser = await getFullUser(user);
  const userSirets = fullUser.companies.map(c => c.siret);

  const formSirets = [
    form.emitterCompanySiret,
    form.destinationCompanySiret,
    form.transporterCompanySiret,
    form.workerCompanySiret
  ];

  const siretsInCommon = userSirets.filter(siret => formSirets.includes(siret));

  return siretsInCommon.length;
}

export async function checkCanDeleteBsda(user: User, form: Bsda) {
  await checkIsFormContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à supprimer ce bordereau."
  );

  if (form.status !== BsdaStatus.INITIAL) {
    throw new ForbiddenError(
      "Seuls les bordereaux en brouillon ou n'ayant pas encore été signés peuvent être supprimés"
    );
  }

  return true;
}
