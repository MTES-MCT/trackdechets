import { prisma } from "@td/prisma";
import { EmitterType, Status } from "@prisma/client";
import Decimal from "decimal.js";
import { enqueueUpdateAppendix2Job } from "../queue/producers/updateAppendix2";
import { getFormRepository } from "./repository";
import { bsddWasteQuantities } from "./helpers/bsddWasteQuantities";

const DECIMAL_WEIGHT_PRECISION = 6; // gramme

type UpdateAppendix2FnArgs = {
  // Identifiant du bordereau annexé
  formId: string;
  // Utilisateur à l'origine de la modification
  user: Express.User;
};

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
export async function updateAppendix2Fn(args: UpdateAppendix2FnArgs) {
  const { formId, user } = args;

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

  const wasteQuantities = bsddWasteQuantities(form.forwardedIn ?? form);

  const quantityReceived = form.forwardedIn
    ? form.forwardedIn.quantityReceived
    : form.quantityReceived;

  const quantityAccepted =
    wasteQuantities?.quantityAccepted ?? quantityReceived;

  const quantityGrouped = new Decimal(
    groupements
      .filter(grp => grp.initialFormId === form.id)
      .map(grp => grp.quantity)
      .reduce((prev, cur) => prev + cur, 0) ?? 0
  ).toDecimalPlaces(DECIMAL_WEIGHT_PRECISION); // set precision to gramme

  // on a quelques quantityReceived avec des décimales au delà du gramme
  const groupedInTotality =
    quantityAccepted &&
    quantityGrouped.greaterThanOrEqualTo(
      quantityAccepted.toDecimalPlaces(DECIMAL_WEIGHT_PRECISION) // limit precision to circumvent rogue decimal digits
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

  const { updateMany: updateManyForms, findGroupedFormsById } =
    getFormRepository(user);

  if (
    nextStatus !== form.status ||
    !quantityGrouped.equals(new Decimal(form.quantityGrouped))
  ) {
    await updateManyForms(
      [form.id, ...(form.forwardedIn ? [form.forwardedIn.id] : [])],
      {
        status: nextStatus,
        quantityGrouped: quantityGrouped.toNumber()
      }
    );

    if (
      form.emitterType === EmitterType.APPENDIX2 &&
      nextStatus === "PROCESSED"
    ) {
      const groupedForms = await findGroupedFormsById(form.id);
      for (const formId of groupedForms.map(f => f.id)) {
        await enqueueUpdateAppendix2Job({
          formId,
          userId: user.id,
          auth: user.auth
        });
      }
    }
  }
}
