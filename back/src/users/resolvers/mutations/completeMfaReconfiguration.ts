import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";

/**
 * Finalise le parcours de reconfiguration MFA obligatoire.
 * Appelée après que l'utilisateur a :
 *  - configuré un nouveau TOTP (confirmTotpSetup)
 *  - obtenu ses nouveaux codes de récupération
 *  - confirmé leur sauvegarde
 * Remet mustReconfigureMfa à false et débloque l'accès à la plateforme.
 */
const completeMfaReconfigurationResolver: MutationResolvers["completeMfaReconfiguration"] =
  async (_, __, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    if (!dbUser.mustReconfigureMfa) {
      throw new UserInputError(
        "Aucune reconfiguration MFA n'est en attente pour ce compte."
      );
    }

    if (!dbUser.totpSeed || !dbUser.totpActivatedAt) {
      throw new UserInputError(
        "Le parcours de reconfiguration MFA n'est pas complet. Configurez d'abord un nouveau second facteur."
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { mustReconfigureMfa: false }
    });

    return {
      ...updatedUser,
      companies: [],
      featureFlags: [],
      totpEnabled: true,
      mustReconfigureMfa: false
    };
  };

export default completeMfaReconfigurationResolver;
