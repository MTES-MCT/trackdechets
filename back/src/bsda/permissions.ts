import { User, Bsda, BsdaStatus } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { NotFormContributor } from "../forms/errors";
import { getCachedUserSirets } from "../common/redis/users";

import prisma from "../prisma";
import { getPreviousBsdas } from "./database";

type BsdaContributors = Pick<
  Bsda,
  | "emitterCompanySiret"
  | "destinationCompanySiret"
  | "transporterCompanySiret"
  | "workerCompanySiret"
  | "brokerCompanySiret"
  | "destinationOperationNextDestinationCompanySiret"
>;

export const BSDA_REVISION_REQUESTER_FIELDS: Record<
  string,
  keyof BsdaContributors
> = {
  emitter: "emitterCompanySiret",
  destination: "destinationCompanySiret",
  worker: "workerCompanySiret"
};

export const BSDA_CONTRIBUTORS_FIELDS: Record<string, keyof BsdaContributors> =
  {
    emitter: "emitterCompanySiret",
    destination: "destinationCompanySiret",
    transporter: "transporterCompanySiret",
    worker: "workerCompanySiret",
    broker: "brokerCompanySiret",
    nextDestination: "destinationOperationNextDestinationCompanySiret"
  };

export async function checkCanAccessBsdaPdf(user: User, bsda: Bsda) {
  const isContributor = await isBsdaContributor(user, bsda);
  if (isContributor) return true;

  const previousBsdas = await getPreviousBsdas(bsda);
  for (const previousBsda of previousBsdas) {
    if (await isBsdaContributor(user, previousBsda)) return true;
  }

  throw new NotFormContributor(
    "Vous n'êtes pas autorisé à accéder au bordereau de ce BSDA."
  );
}

export async function checkIsBsdaContributor(
  user: User,
  form: Partial<BsdaContributors>,
  errorMsg: string
) {
  const isContributor = await isBsdaContributor(user, form);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}

export async function isBsdaContributor(user: User, bsda: Partial<Bsda>) {
  const userSirets = await getCachedUserSirets(user.id);

  const formSirets = Object.values(BSDA_CONTRIBUTORS_FIELDS).map(
    field => bsda[field]
  );

  return userSirets.some(siret => formSirets.includes(siret));
}

export async function checkCanDeleteBsda(user: User, bsda: Bsda) {
  await checkIsBsdaContributor(
    user,
    bsda,
    "Vous n'êtes pas autorisé à supprimer ce bordereau."
  );

  const userSirets = await getCachedUserSirets(user.id);
  const isBsdaEmitter = userSirets.some(
    siret => bsda.emitterCompanySiret === siret
  );

  if (
    bsda.status !== BsdaStatus.INITIAL &&
    (!isBsdaEmitter || bsda.status !== BsdaStatus.SIGNED_BY_PRODUCER)
  ) {
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

  if (bsdas.some(bsda => bsda.status !== "AWAITING_CHILD")) {
    throw new UserInputError(
      `Les bordereaux ne peuvent pas être associés à un bordereau enfant.`
    );
  }
}

export async function checkCanRequestRevision(user: User, bsda: Bsda) {
  const userSirets = await getCachedUserSirets(user.id);

  const formSirets = Object.values(BSDA_REVISION_REQUESTER_FIELDS).map(
    field => bsda[field]
  );

  if (!userSirets.some(siret => formSirets.includes(siret))) {
    throw new UserInputError(`Vous n'êtes pas autorisé à réviser ce bordereau`);
  }
}
