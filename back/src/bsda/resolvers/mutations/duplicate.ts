import {
  Bsda,
  BsdaStatus,
  IntermediaryBsdaAssociation,
  Prisma
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationDuplicateBsdaArgs } from "../../../generated/graphql/types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { checkIsBsdaContributor } from "../../permissions";
import { getBsdaRepository } from "../../repository";

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsdaArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaBsda = await getBsdaOrNotFound(id, {
    include: { intermediaries: true }
  });

  await checkIsBsdaContributor(
    user,
    prismaBsda,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const data = duplicateBsda(prismaBsda);
  const newBsda = await getBsdaRepository(user).create(data);

  return expandBsdaFromDb(newBsda);
}

function duplicateBsda({
  id,
  createdAt,
  updatedAt,
  emitterEmissionSignatureAuthor,
  emitterEmissionSignatureDate,
  emitterCustomInfo,
  workerWorkHasEmitterPaperSignature,
  workerWorkSignatureAuthor,
  workerWorkSignatureDate,
  transporterTransportPlates,
  transporterCustomInfo,
  transporterTransportTakenOverAt,
  transporterTransportSignatureAuthor,
  transporterTransportSignatureDate,
  destinationCustomInfo,
  destinationReceptionWeight,
  destinationReceptionDate,
  destinationReceptionAcceptationStatus,
  destinationReceptionRefusalReason,
  destinationOperationCode,
  destinationOperationSignatureAuthor,
  destinationOperationSignatureDate,
  destinationOperationDate,
  wasteSealNumbers,
  forwardingId,
  groupedInId,
  intermediaries,
  intermediariesOrgIds,
  ...rest
}: Bsda & {
  intermediaries: IntermediaryBsdaAssociation[];
}): Prisma.BsdaCreateInput {
  return {
    ...rest,
    id: getReadableId(ReadableIdPrefix.BSDA),
    status: BsdaStatus.INITIAL,
    isDraft: true,
    packagings: rest.packagings ?? Prisma.JsonNull,
    ...(intermediaries && {
      intermediaries: {
        createMany: {
          data: intermediaries.map(intermediary => ({
            siret: intermediary.siret,
            address: intermediary.address,
            vatNumber: intermediary.vatNumber,
            name: intermediary.name,
            contact: intermediary.contact,
            phone: intermediary.phone,
            mail: intermediary.mail
          }))
        }
      },
      intermediariesOrgIds
    })
  };
}
