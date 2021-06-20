import { User, Bsda, BsdaStatus, BsdaType } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { NotFormContributor } from "../forms/errors";
import prisma from "../prisma";
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

export async function checkCanAssociateBsdas(ids: string[]) {
  if (!ids || ids.length === 0) {
    return;
  }

  const bsdas = await prisma.bsda.findMany({
    where: {
      id: {
        in: ids
      }
    }
  });

  if (
    bsdas.some(
      bsda =>
        ![BsdaType.GATHERING, BsdaType.RESHIPMENT].includes(bsda.type as any) ||
        bsda.status !== "AWAITING_CHILD"
    )
  ) {
    throw new UserInputError(
      `Les bordereaux ne peuvent pas être associés à un bordereau enfant.`
    );
  }
}
