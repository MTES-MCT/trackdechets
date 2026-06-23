import { User, UserRole } from "@td/prisma";
import { prisma } from "@td/prisma";
import {
  onMfaResetRequestCreatedForAdmins,
  onMfaResetRequestCreatedForUser,
  renderMail
} from "@td/mail";
import { logger } from "@td/logger";
import { sendMail } from "../../mailer/mailing";

/**
 * Envoie les e-mails 2 et 3 lors de la création d'une demande de réinitialisation MFA.
 *
 * - E-mail 2 : notifie chaque administrateur des établissements auxquels le compte
 *   est rattaché, en excluant le titulaire lui-même.
 * - E-mail 3 : confirme la prise en charge au titulaire du compte.
 *
 * Les envois sont non bloquants : une erreur d'envoi ne fait pas échouer la mutation.
 */
export async function sendMfaResetRequestCreatedEmails(
  targetUser: User
): Promise<void> {
  await Promise.all([
    sendAdminNotificationEmails(targetUser),
    sendUserConfirmationEmail(targetUser)
  ]);
}

async function sendAdminNotificationEmails(targetUser: User): Promise<void> {
  // Récupère les établissements du compte concerné
  const userAssociations = await prisma.companyAssociation.findMany({
    where: { userId: targetUser.id },
    select: { companyId: true }
  });

  if (userAssociations.length === 0) {
    return;
  }

  const companyIds = userAssociations.map(a => a.companyId);

  // Pour chaque établissement, récupère les admins (hors titulaire) avec infos company
  const adminAssociations = await prisma.companyAssociation.findMany({
    where: {
      companyId: { in: companyIds },
      role: UserRole.ADMIN,
      userId: { not: targetUser.id }
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      company: { select: { siret: true, name: true, orgId: true } }
    }
  });

  if (adminAssociations.length === 0) {
    return;
  }

  // Déduplique par (adminUserId, companyId) — normalement déjà le cas en BDD
  // mais on évite tout doublon côté application
  const seen = new Set<string>();
  const unique = adminAssociations.filter(a => {
    const key = `${a.userId}:${a.companyId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Envoi non bloquant par (admin, établissement)
  const sends = unique.map(({ user: admin, company }) =>
    sendMail(
      renderMail(onMfaResetRequestCreatedForAdmins, {
        to: [{ name: admin.name, email: admin.email }],
        variables: {
          adminName: admin.name,
          companySiret: company.siret ?? company.orgId,
          companyName: company.name ?? company.siret ?? company.orgId,
          userEmail: targetUser.email
        }
      })
    ).catch(err =>
      logger.error(
        `[MFA reset] Erreur envoi email 2 admin ${admin.email} pour utilisateur ${targetUser.email}`,
        err
      )
    )
  );

  await Promise.all(sends);
}

async function sendUserConfirmationEmail(targetUser: User): Promise<void> {
  await sendMail(
    renderMail(onMfaResetRequestCreatedForUser, {
      to: [{ name: targetUser.name, email: targetUser.email }],
      variables: {
        name: targetUser.name,
        email: targetUser.email
      }
    })
  ).catch(err =>
    logger.error(
      `[MFA reset] Erreur envoi email 3 titulaire ${targetUser.email}`,
      err
    )
  );
}
