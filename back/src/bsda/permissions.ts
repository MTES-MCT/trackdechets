import {
  User,
  Bsda,
  BsdaStatus,
  IntermediaryBsdaAssociation,
  Prisma
} from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { NotFormContributor } from "../forms/errors";
import { getCachedUserSiretOrVat } from "../common/redis/users";

import prisma from "../prisma";
import { getPreviousBsdas } from "./database";

const bsdaSiretFields = Prisma.validator<Prisma.BsdaArgs>()({
  select: {
    emitterCompanySiret: true,
    destinationCompanySiret: true,
    transporterCompanySiret: true,
    workerCompanySiret: true,
    brokerCompanySiret: true,
    destinationOperationNextDestinationCompanySiret: true
  }
});
type BsdaFlatSiretsFields = Prisma.BsdaGetPayload<typeof bsdaSiretFields>;

type BsdaContributors = Partial<BsdaFlatSiretsFields> & {
  intermediaries: Partial<
    Pick<IntermediaryBsdaAssociation, "siret" | "vatNumber">
  >[];
};

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

export async function checkCanAccessBsdaPdf(
  user: User,
  bsda: BsdaContributors & Pick<Bsda, "id" | "forwardingId">
) {
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
  bsda: BsdaContributors,
  errorMsg: string
) {
  const isContributor = await isBsdaContributor(user, bsda);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}

export async function isBsdaContributor(user: User, bsda: BsdaContributors) {
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const formSirets = Object.values(BSDA_CONTRIBUTORS_FIELDS).map(
    field => bsda[field]
  );

  const intermerdiariesSirets = bsda.intermediaries?.flatMap(i => [
    i.siret,
    i.vatNumber
  ]);

  return userCompaniesSiretOrVat.some(
    siret =>
      formSirets.includes(siret) || intermerdiariesSirets?.includes(siret)
  );
}

export async function checkCanDeleteBsda(
  user: User,
  bsda: BsdaContributors & Pick<Bsda, "status">
) {
  await checkIsBsdaContributor(
    user,
    bsda,
    "Vous n'êtes pas autorisé à supprimer ce bordereau."
  );

  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);
  const isBsdaEmitter = userCompaniesSiretOrVat.some(
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
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const formSirets = Object.values(BSDA_REVISION_REQUESTER_FIELDS).map(
    field => bsda[field]
  );

  if (!userCompaniesSiretOrVat.some(siret => formSirets.includes(siret))) {
    throw new UserInputError(`Vous n'êtes pas autorisé à réviser ce bordereau`);
  }
}
