import { prisma } from "@td/prisma";
import type { MutationResolvers } from "@td/codegen-back";
import { checkIsAdmin } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { hashPassword } from "../../utils";
import { getUid } from "../../../utils";
import { UserInputError } from "../../../common/errors";
import {
  checkCompanyAssociations,
  checkApplications,
  deleteUserCompanyAssociations,
  deleteUserActivationHashes,
  deleteUserAccessTokens,
  deleteUserGrants,
  deleteMembershipRequest
} from "../../database";
import { z } from "zod";

const idOrEmailSchema = z
  .string()
  .transform(v => v.trim())
  .pipe(
    z.union([z.string().email(), z.string().cuid()], {
      errorMap: () => ({
        message:
          "Le format de l'identifiant est invalide. Veuillez fournir un identifiant (cuid) ou une adresse email valide."
      })
    })
  );

/**
 * Soft-delete by anonymizing a User.
 * @param idOrEmail - either a database ID (cuid) or an email address
 */
async function anonymizeUserFn(idOrEmail: string): Promise<string> {
  const result = idOrEmailSchema.safeParse(idOrEmail);

  if (!result.success) {
    throw new UserInputError(
      result.error.issues.map(i => i.message).join(", ")
    );
  }

  const parsed = result.data;
  const isEmail = z.string().email().safeParse(parsed).success;

  const user = isEmail
    ? await prisma.user.findUnique({ where: { email: parsed } })
    : await prisma.user.findUnique({ where: { id: parsed } });

  if (!user) {
    throw new UserInputError(`Utilisateur ${parsed} introuvable`);
  }
  if (!user.isActive) {
    throw new UserInputError(`Utilisateur ${parsed} déjà inactif`);
  }
  const errors = [
    ...(await checkCompanyAssociations(user)),
    ...(await checkApplications(user))
  ];

  if (errors.length > 0) {
    throw new UserInputError(errors.join("\n"));
  }

  const uuid = getUid(16);
  const anonEmail = `${uuid}-anonymous@trackdechets.fr`;
  try {
    await prisma.$transaction(async transaction => {
      await deleteUserCompanyAssociations(user, transaction);
      await deleteUserActivationHashes(user, transaction);
      await deleteUserAccessTokens(user, transaction);
      await deleteUserGrants(user, transaction);
      await deleteMembershipRequest(user, transaction);
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          email: anonEmail,
          name: uuid,
          isActive: false,
          phone: "00000000",
          password: await hashPassword(getUid(16)),
          passwordUpdatedAt: new Date()
        }
      });
    });

    return anonEmail;
  } catch (err) {
    throw new UserInputError(`Impossible de supprimer cet utilisateur: ${err}`);
  }
}

const anonymizeUserResolver: MutationResolvers["anonymizeUser"] = (
  _,
  { idOrEmail },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);
  return anonymizeUserFn(idOrEmail);
};

export default anonymizeUserResolver;
