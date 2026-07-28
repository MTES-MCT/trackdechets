import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAdmin } from "../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";

const DEFAULT_FIRST = 50;
const MAX_FIRST = 500;

const mfaAuditLogsResolver: QueryResolvers["mfaAuditLogs"] = async (
  _,
  { userId, eventType, skip = 0, first = DEFAULT_FIRST },
  context
) => {
  // Session uniquement — pas d'accès via token API
  applyAuthStrategies(context, [AuthType.Session]);

  // Vérifie isAdmin + MFA activée sur le compte admin
  checkIsAdmin(context);

  const where = {
    ...(userId ? { userId } : {}),
    ...(eventType ? { eventType } : {})
  };

  return prisma.mfaAuditLog.findMany({
    where,
    orderBy: { loggedAt: "desc" },
    skip: skip ?? 0,
    take: Math.min(first ?? DEFAULT_FIRST, MAX_FIRST)
  });
};

export default mfaAuditLogsResolver;
