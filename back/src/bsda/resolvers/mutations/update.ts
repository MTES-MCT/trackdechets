import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { companyToIntermediaryInput, expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound, getFirstTransporterSync } from "../../database";
import { checkCanUpdate } from "../../permissions";
import { getBsdaRepository } from "../../repository";
import { mergeInputAndParseBsdaAsync } from "../../validation";
import { Bsda, BsdaStatus, Prisma } from "@prisma/client";
import {
  bsdaDestinationCapModificationEmail,
  MessageVersion,
  renderMail
} from "@td/mail";
import { sendMail } from "../../../mailer/mailing";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const existingBsda = await getBsdaOrNotFound(id, {
    include: {
      intermediaries: true,
      grouping: true,
      forwarding: true,
      transporters: true
    }
  });

  const existingFirstTransporter = getFirstTransporterSync(existingBsda)!;

  await checkCanUpdate(user, existingBsda, input);

  const { parsedBsda: bsda, updatedFields } = await mergeInputAndParseBsdaAsync(
    existingBsda,
    input,
    {
      user,
      enableCompletionTransformers: true,
      enablePreviousBsdasChecks: true
    }
  );

  if (updatedFields.length === 0) {
    // Évite de faire un update "à blanc" si l'input
    // ne modifie pas les données. Cela permet de limiter
    // le nombre d'évenements crées dans Mongo.
    return expandBsdaFromDb(existingBsda);
  }

  const forwarding = !!bsda.forwarding
    ? { connect: { id: bsda.forwarding } }
    : bsda.forwarding === null
    ? { disconnect: true }
    : undefined;
  const grouping =
    bsda.grouping && bsda.grouping.length > 0
      ? { set: bsda.grouping.map(id => ({ id })) }
      : undefined;
  const intermediaries = bsda.intermediaries
    ? {
        deleteMany: {},
        ...(bsda.intermediaries.length > 0 && {
          createMany: {
            data: companyToIntermediaryInput(bsda.intermediaries)
          }
        })
      }
    : undefined;

  let transporters:
    | Prisma.BsdaTransporterUpdateManyWithoutBsdaNestedInput
    | undefined = undefined;

  if (updatedFields.includes("transporters")) {
    if (input.transporter) {
      if (existingFirstTransporter) {
        // on met à jour le premier transporteur existant
        const { id, number, bsdaId, ...data } = bsda.transporters![0];
        transporters = { update: { where: { id: id! }, data } };
      } else {
        // on crée le premier transporteur
        const { id, bsdaId, ...data } = bsda.transporters![0];
        transporters = { create: { ...data, number: 1 } };
      }
    } else {
      // Cas où l'update est fait via `BsdaInput.transporters`. On déconnecte tous les transporteurs qui étaient
      // précédement associés et on connecte les nouveaux transporteurs de la table `BsdaTransporter`
      // avec ce bordereau. La fonction `update` du repository s'assure que la numérotation des
      // transporteurs correspond à l'ordre du tableau d'identifiants.
      transporters = {
        set: [],
        connect: bsda.transporters!.map(t => ({ id: t.id! }))
      };
    }
  }

  const bsdaRepository = getBsdaRepository(user);
  const updatedBsda = await bsdaRepository.update(
    { id },
    {
      ...bsda,
      forwarding,
      grouping,
      intermediaries,
      transporters
    }
  );

  // Si le CAP de la destination a été modifié, il faut
  // peut-être notifier l'émetteur
  if (
    producerShouldBeNotifiedOfDestinationCapModification(
      existingBsda,
      updatedBsda
    )
  ) {
    await sendDestinationCapModificationMail(existingBsda, updatedBsda);
  }

  return expandBsdaFromDb(updatedBsda);
}

export const producerShouldBeNotifiedOfDestinationCapModification = (
  previousBsda: Bsda,
  updatedBsda: Bsda
) => {
  // On ne notifie que si le bordereau est signé par le producteur
  // et pas encore pris en charge par le transporteur
  if (
    ![BsdaStatus.SIGNED_BY_PRODUCER, BsdaStatus.SIGNED_BY_WORKER].includes(
      updatedBsda.status
    )
  ) {
    return false;
  }

  // Pas de mail si pas d'entreprise de travaux
  if (!updatedBsda.workerCompanySiret) {
    return false;
  }

  // On ne prend pas en compte les particuliers ou les entreprises non inscrites
  if (!updatedBsda.emitterCompanySiret) {
    return false;
  }

  // Pas de TTR
  if (!updatedBsda.destinationOperationNextDestinationCompanySiret) {
    return previousBsda.destinationCap !== updatedBsda.destinationCap;
  }
  // TTR + destination finale
  else {
    return (
      previousBsda.destinationOperationNextDestinationCap !==
      updatedBsda.destinationOperationNextDestinationCap
    );
  }
};

export const sendDestinationCapModificationMail = async (
  previousBsda: Bsda,
  updatedBsda: Bsda
) => {
  const emitterSiret = updatedBsda.emitterCompanySiret;
  const workerSiret = updatedBsda.workerCompanySiret;
  const destinationSiret =
    updatedBsda.destinationOperationNextDestinationCompanySiret ??
    updatedBsda.destinationCompanySiret;

  const companies = await prisma.company.findMany({
    where: {
      orgId: {
        in: [emitterSiret, workerSiret, destinationSiret].filter(Boolean)
      }
    },
    select: {
      id: true,
      orgId: true
    }
  });

  const emitterCompany = companies.find(
    company => company.orgId === emitterSiret
  );

  const companyAssociations = await prisma.companyAssociation.findMany({
    where: {
      companyId: { in: companies.map(company => company.id) },
      notificationIsActiveBsdaFinalDestinationUpdate: true
    },
    include: {
      user: true
    }
  });

  const messageVersion: MessageVersion = {
    to: companyAssociations
      .filter(association => association.companyId === emitterCompany?.id)
      .map(association => ({
        name: association.user.name,
        email: association.user.email
      }))
  };

  const payload = renderMail(bsdaDestinationCapModificationEmail, {
    variables: {
      bsdaId: updatedBsda.id,
      previousCap:
        previousBsda.destinationOperationNextDestinationCap ??
        previousBsda.destinationCap,
      newCap:
        updatedBsda.destinationOperationNextDestinationCap ??
        updatedBsda.destinationCap,
      workerCompanyName: updatedBsda.workerCompanyName,
      workerCompanySiret: updatedBsda.workerCompanySiret
    },
    messageVersions: [messageVersion],
    cc: companyAssociations
      .filter(association => association.companyId !== emitterCompany?.id)
      .map(association => ({
        name: association.user.name,
        email: association.user.email
      }))
  });

  await sendMail(payload);
};
