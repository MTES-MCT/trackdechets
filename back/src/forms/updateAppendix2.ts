import { prisma } from "@td/prisma";
import { UpdateAppendix2JobArgs } from "../queue/jobs/updateAppendix2";
import { EmitterType, Status } from "@prisma/client";
import Decimal from "decimal.js";
import { enqueueUpdateAppendix2Job } from "../queue/producers/updateAppendix2";

export type UpdateAppendix2FormsOpts = {
  // Identifiant du BSDD de groupement dont on souhaite mettre à jour
  // les informations des annexes 2
  formId: string;
  // Permet de jouer la récursion des hooks en synchrone
  runSync: boolean;
};

const DECIMAL_WEIGHT_PRECISION = 6; // gramme

/**
 * Hook permettant de mettre à jour les champs `status` et `quantityGrouped`
 * sur l'ensemble des bordereaux annexés à un bordereau de groupement.
 */
export async function updateAppendix2Hook(
  // Identifiant du bordereau de groupement dont on souhaite mettre
  // à jour les informations des annexes 2.
  formId: string,
  runSync = false
) {
  const groupements = await prisma.formGroupement.findMany({
    where: { nextFormId: formId },
    select: { initialFormId: true }
  });
  for (const initialFormId of groupements.map(g => g.initialFormId)) {
    if (runSync) {
      await updateAppendix2Fn({ formId: initialFormId }, runSync);
    } else {
      await enqueueUpdateAppendix2Job({ formId: initialFormId });
    }
  }
}

/**
 * Cette fonction permet de recalculer les champs `status` et `quantityGrouped`
 * d'un bordereau annexé à un bordereau de groupement en fonction de l'état des
 * différents bordereaux dans lesquels il est regoupé. Si le bordereau sur lequel
 * s'applique la fonction est lui même un bordereau de groupement, la fonction sera
 * appelée en récursif via un appel à `updateAppendix2Hook`.
 *
 * Cette fonction doit être appelée sur un BSDD dès qu'il y a une création / modification /
 * suppression / annulation / traitement sur un des bordereaux de groupement auquel le
 * bordereau appartient.
 */
export async function updateAppendix2Fn(
  args: UpdateAppendix2JobArgs,
  runSync = false
) {
  const { formId } = args;

  const form = await prisma.form.findUniqueOrThrow({
    where: { id: formId },
    include: {
      forwardedIn: true
    }
  });

  if (
    !(form.status === Status.AWAITING_GROUP || form.status === Status.GROUPED)
  ) {
    // Cette fonction n'est pertinente que pour des bordereaux regroupés ou attente de regroupement
    return;
  }

  // Un même bordereau initial peut être annexé à plusieurs bordereaux de groupement
  // grâce à la ventilation des quantités. On a donc besoin de récupérer
  // l'ensemble des groupements auquel ce bordereau appartient pour calculer son statut
  // et sa quantité totale regroupée
  const groupements = await prisma.formGroupement.findMany({
    where: { initialFormId: formId },
    include: { nextForm: { select: { status: true } } }
  });

  // Liste les bordereaux de regroupements auquel ce bordereau fait partie
  const groupementForms = groupements
    .filter(grp => grp.initialFormId === form.id)
    .map(g => g.nextForm);

  const quantityReceived = form.forwardedIn
    ? form.forwardedIn.quantityReceived
    : form.quantityReceived;

  const quantityGrouped = new Decimal(
    groupements
      .filter(grp => grp.initialFormId === form.id)
      .map(grp => grp.quantity)
      .reduce((prev, cur) => prev + cur, 0) ?? 0
  ).toDecimalPlaces(DECIMAL_WEIGHT_PRECISION); // set precision to gramme

  // on a quelques quantityReceived avec des décimales au delà du gramme
  const groupedInTotality =
    quantityReceived &&
    quantityGrouped.greaterThanOrEqualTo(
      new Decimal(quantityReceived).toDecimalPlaces(DECIMAL_WEIGHT_PRECISION) // limit precision to circumvent rogue decimal digits
    ); // case > should not happen

  const allSealed =
    groupementForms.length &&
    groupedInTotality &&
    groupementForms.reduce(
      (acc, form) => acc && form.status !== Status.DRAFT,
      true
    );

  const allProcessed =
    groupementForms.length &&
    groupedInTotality &&
    groupementForms.reduce(
      (acc, form) =>
        acc &&
        [
          Status.PROCESSED,
          Status.NO_TRACEABILITY,
          Status.FOLLOWED_WITH_PNTTD
        ].includes(form.status as any),
      true
    );

  const nextStatus = allProcessed
    ? Status.PROCESSED
    : allSealed
    ? Status.GROUPED
    : Status.AWAITING_GROUP;

  await prisma.form.update({
    where: { id: form.id },
    data: { quantityGrouped: quantityGrouped.toNumber(), status: nextStatus }
  });

  if (form.emitterType === EmitterType.APPENDIX2) {
    await updateAppendix2Hook(form.id, runSync);
  }
}
