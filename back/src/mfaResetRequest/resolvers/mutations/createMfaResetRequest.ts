import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAdmin } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { prisma, MfaResetRequest } from "@td/prisma";
import { addHours } from "date-fns";
import { UserInputError } from "../../../common/errors";
import {
  findTargetUserOrThrow,
  assertNoPendingRequest
} from "./utils/mfaResetRequest.utils";

const MFA_RESET_DELAY_HOURS = 48;

const createMfaResetRequest = async (
  _: unknown,
  { input }: { input: { email: string; note?: string | null } },
  context: GraphQLContext
): Promise<MfaResetRequest> => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  const { email, note } = input;

  if (!email || typeof email !== "string") {
    throw new UserInputError("L'email est requis.");
  }

  // Vérifie que le compte existe, est actif, a une MFA active
  const targetUser = await findTargetUserOrThrow(email);

  // Vérifie qu'aucune demande PENDING n'existe — check AVANT la transaction
  // (réduction de la fenêtre de race condition ; le check est répété dans la transaction)
  await assertNoPendingRequest(targetUser.id);

  const dueAt = addHours(new Date(), MFA_RESET_DELAY_HOURS);

  // Transaction atomique : création demande + suspension du compte
  const mfaResetRequest = await prisma.$transaction(async tx => {
    // Double-check anti-doublon dans la transaction
    const conflict = await tx.mfaResetRequest.findFirst({
      where: { userId: targetUser.id, status: "PENDING" }
    });

    if (conflict) {
      throw new UserInputError(
        "Une demande de réinitialisation MFA est déjà en cours pour ce compte."
      );
    }

    const request = await tx.mfaResetRequest.create({
      data: {
        user: { connect: { id: targetUser.id } },
        status: "PENDING",
        note: note ?? null,
        dueAt
      }
    });

    await tx.user.update({
      where: { id: targetUser.id },
      data: { mfaResetSuspended: true }
    });

    return request;
  });

  return mfaResetRequest;
};

export default createMfaResetRequest;
