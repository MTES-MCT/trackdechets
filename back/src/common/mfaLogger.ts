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

// Switch over string literals so CodeQL sees no taint flow from eventType to the return value.
function toSafeMfaEventLabel(eventType: MfaEventType): string {
  switch (eventType) {
    case "MFA_SETUP_INITIATED":
      return "MFA_SETUP_INITIATED";
    case "MFA_ACTIVATED":
      return "MFA_ACTIVATED";
    case "MFA_ACTIVATION_ABANDONED":
      return "MFA_ACTIVATION_ABANDONED";
    case "MFA_DISABLED":
      return "MFA_DISABLED";
    case "MFA_LOGIN_SUCCESS":
      return "MFA_LOGIN_SUCCESS";
    case "MFA_LOGIN_FAILURE":
      return "MFA_LOGIN_FAILURE";
    case "MFA_LOCKOUT_TRIGGERED":
      return "MFA_LOCKOUT_TRIGGERED";
    case "MFA_LOCKOUT_LIFTED":
      return "MFA_LOCKOUT_LIFTED";
    case "MFA_RECOVERY_SUCCESS":
      return "MFA_RECOVERY_SUCCESS";
    case "MFA_RECOVERY_FAILURE":
      return "MFA_RECOVERY_FAILURE";
    case "MFA_RECOVERY_LOCKOUT_TRIGGERED":
      return "MFA_RECOVERY_LOCKOUT_TRIGGERED";
    case "MFA_RECOVERY_LOCKOUT_LIFTED":
      return "MFA_RECOVERY_LOCKOUT_LIFTED";
    case "MFA_MANUAL_RESET_INITIATED":
      return "MFA_MANUAL_RESET_INITIATED";
    case "MFA_MANUAL_RESET_BY_SUPPORT":
      return "MFA_MANUAL_RESET_BY_SUPPORT";
    case "MFA_RECONFIG_COMPLETED":
      return "MFA_RECONFIG_COMPLETED";
    default:
      return "UNKNOWN_MFA_EVENT";
  }
}

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
    mfa_event_type: toSafeMfaEventLabel(eventType),
    user_id: userId,
    success,
    ip: ip ?? null
  });

  // Persistence en base pour Metabase (fire-and-forget, non bloquant)
  prisma.mfaAuditLog
    .create({ data: { userId, eventType, success, ip: ip ?? null } })
    .catch(err =>
      logger.error("mfa_audit_log_write_error", { error: err?.message })
    );
}
