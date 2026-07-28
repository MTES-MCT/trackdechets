import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAdmin } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { prisma, MfaResetRequest, MfaResetRequestStatus } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { sendMail } from "../../../mailer/mailing";
import { onMfaResetCancelled, renderMail } from "@td/mail";
import { logger } from "@td/logger";
import { getMfaResetRequestOrThrow } from "./utils/mfaResetRequest.utils";

const cancelMfaResetRequest = async (
  _: unknown,
  { mfaResetRequestId }: { mfaResetRequestId: string },
  context: GraphQLContext
): Promise<MfaResetRequest> => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  const existing = await getMfaResetRequestOrThrow(mfaResetRequestId);

  if (existing.status !== MfaResetRequestStatus.PENDING) {
    throw new UserInputError(
      `Impossible d'annuler une demande au statut "${existing.status}". Seules les demandes en attente (PENDING) peuvent être annulées.`
    );
  }

  // Transaction atomique : annulation demande + levée de suspension
  // Ne touche pas totpSeed, totpActivatedAt ni les recovery codes
  const cancelled = await prisma.$transaction(async tx => {
    const updated = await tx.mfaResetRequest.update({
      where: { id: mfaResetRequestId },
      data: { status: MfaResetRequestStatus.CANCELLED },
      include: { user: true }
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: { mfaResetSuspended: false }
    });

    return updated;
  });

  // Email d'annulation (non bloquant — ne pas faire échouer la mutation si l'envoi échoue)
  sendMail(
    renderMail(onMfaResetCancelled, {
      to: [{ name: existing.user.name, email: existing.user.email }],
      variables: { name: existing.user.name, email: existing.user.email }
    })
  ).catch(err =>
    logger.error(
      `[MFA reset] Erreur envoi email 4 annulation demande ${mfaResetRequestId} pour utilisateur ${existing.user.email}`,
      err
    )
  );

  return cancelled;
};

export default cancelMfaResetRequest;
