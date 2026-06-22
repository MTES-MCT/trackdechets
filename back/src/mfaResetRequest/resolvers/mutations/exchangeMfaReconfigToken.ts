import crypto from "crypto";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { AuthType } from "../../../auth/auth";
import type { GraphQLContext } from "../../../types";

/**
 * Échange le token sécurisé reçu par e-mail contre une session authentifiée.
 *
 * Appelée depuis la page /mfa-reconfiguration?token=... (TRA-17933).
 * Pas d'authentification préalable requise : le token constitue le facteur d'identité.
 *
 * Préconditions vérifiées :
 *  - token non vide, hash sha256 trouvé en base
 *  - token non expiré
 *  - token non encore utilisé
 *  - compte en état mustReconfigureMfa=true ET mfaResetSuspended=true
 *
 * En cas de succès (transaction atomique) :
 *  - token marqué used=true
 *  - mfaResetSuspended levé à false
 *  - session établie (req.logIn)
 */
const exchangeMfaReconfigToken = async (
  _: unknown,
  { token }: { token: string },
  context: GraphQLContext
): Promise<{ id: string; mustReconfigureMfa: boolean }> => {
  if (!token) {
    throw new UserInputError("Lien de reconfiguration invalide.");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const record = await prisma.mfaReconfigToken.findUnique({
    where: { token: tokenHash },
    include: { user: true }
  });

  if (!record) {
    throw new UserInputError("Lien de reconfiguration invalide.");
  }

  if (record.used) {
    throw new UserInputError(
      "Ce lien de reconfiguration a déjà été utilisé. Contactez notre support via l'Assistance Trackdéchets si vous avez besoin d'un nouveau lien."
    );
  }

  if (record.tokenExpires < new Date()) {
    throw new UserInputError(
      "Ce lien de reconfiguration a expiré. Contactez notre support via l'Assistance Trackdéchets pour obtenir un nouveau lien."
    );
  }

  const user = record.user;

  if (!user.mustReconfigureMfa || !user.mfaResetSuspended) {
    // L'utilisateur n'est plus en attente de reconfiguration (reconfiguration déjà
    // effectuée ou état incohérent). On invalide le token par sécurité.
    await prisma.mfaReconfigToken.update({
      where: { id: record.id },
      data: { used: true }
    });
    throw new UserInputError("Lien de reconfiguration invalide.");
  }

  // Transaction atomique : usage unique + levée de suspension
  await prisma.$transaction([
    prisma.mfaReconfigToken.update({
      where: { id: record.id },
      data: { used: true }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { mfaResetSuspended: false }
    })
  ]);

  // Établit la session — l'utilisateur est authentifié mais reste bloqué
  // par RequireAuth (mustReconfigureMfa=true) jusqu'à la fin du wizard.
  await new Promise<void>((resolve, reject) => {
    context.req.logIn(
      { ...user, auth: AuthType.Session },
      (err: Error | null) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

  return { id: user.id, mustReconfigureMfa: user.mustReconfigureMfa };
};

export default exchangeMfaReconfigToken;
