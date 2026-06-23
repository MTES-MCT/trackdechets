import { logger } from "@td/logger";
import { prisma } from "@td/prisma";

export type MfaEventType =
  | "MFA_SETUP_INITIATED"
  | "MFA_ACTIVATED"
  | "MFA_ACTIVATION_ABANDONED"
  | "MFA_DISABLED"
  | "MFA_LOGIN_SUCCESS"
  | "MFA_LOGIN_FAILURE"
  | "MFA_LOCKOUT_TRIGGERED"
  | "MFA_LOCKOUT_LIFTED"
  | "MFA_RECOVERY_SUCCESS"
  | "MFA_RECOVERY_FAILURE"
  | "MFA_RECOVERY_LOCKOUT_TRIGGERED"
  | "MFA_RECOVERY_LOCKOUT_LIFTED"
  | "MFA_MANUAL_RESET_INITIATED"
  | "MFA_MANUAL_RESET_BY_SUPPORT"
  | "MFA_RECONFIG_COMPLETED";

export function logMfaEvent({
  eventType,
  userId,
  success,
  ip
}: {
  eventType: MfaEventType;
  userId: string;
  success: boolean;
  ip?: string;
}) {
  logger.info("mfa_event", {
    timestamp: new Date().toISOString(), // ISO 8601 : "2026-05-14T10:30:00.000Z"
    mfa_event_type: eventType,
    user_id_suffix: userId.slice(-4),
    success,
    ip_present: Boolean(ip)
  });

  // Persistence en base pour Metabase (fire-and-forget, non bloquant)
  prisma.mfaAuditLog
    .create({ data: { userId, eventType, success, ip: ip ?? null } })
    .catch(err =>
      logger.error("mfa_audit_log_write_error", { error: err?.message })
    );
}
