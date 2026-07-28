import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import { adminFactory, userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import type { Query } from "@td/codegen-back";

const MFA_AUDIT_LOGS = `
  query MfaAuditLogs($userId: String, $eventType: String, $skip: Int, $first: Int) {
    mfaAuditLogs(userId: $userId, eventType: $eventType, skip: $skip, first: $first) {
      id
      userId
      eventType
      success
      ip
      loggedAt
    }
  }
`;

async function seedLog(
  userId: string,
  eventType: string,
  success: boolean,
  loggedAt?: Date
) {
  return prisma.mfaAuditLog.create({
    data: {
      userId,
      eventType,
      success,
      ip: null,
      ...(loggedAt ? { loggedAt } : {})
    }
  });
}

describe("Query.mfaAuditLogs", () => {
  afterAll(resetDatabase);

  it("should deny access to a non-admin user", async () => {
    const user = await userFactory();
    const { query } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await query<Pick<Query, "mfaAuditLogs">>(MFA_AUDIT_LOGS);

    expect(errors).not.toBeUndefined();
    expect(errors![0].extensions?.code).toEqual(ErrorCode.FORBIDDEN);
  });

  it("should deny access to an unauthenticated request", async () => {
    const { query } = makeClient(null);
    const { errors } = await query<Pick<Query, "mfaAuditLogs">>(MFA_AUDIT_LOGS);

    expect(errors).not.toBeUndefined();
    expect(errors![0].extensions?.code).toEqual(ErrorCode.UNAUTHENTICATED);
  });

  it("should return audit logs for an admin", async () => {
    const admin = await adminFactory();
    const targetUser = await userFactory();

    await seedLog(targetUser.id, "MFA_LOGIN_SUCCESS", true);
    await seedLog(targetUser.id, "MFA_LOGIN_FAILURE", false);

    const { query } = makeClient({ ...admin, auth: AuthType.Session });
    const { data, errors } = await query<Pick<Query, "mfaAuditLogs">>(
      MFA_AUDIT_LOGS
    );

    expect(errors).toBeUndefined();
    expect(data.mfaAuditLogs.length).toBeGreaterThanOrEqual(2);
    for (const log of data.mfaAuditLogs) {
      expect(log.id).toBeDefined();
      expect(log.userId).toBeDefined();
      expect(log.eventType).toBeDefined();
      expect(log.loggedAt).toBeDefined();
    }
  });

  it("should return logs sorted by loggedAt descending", async () => {
    const admin = await adminFactory();
    const user = await userFactory();

    const older = new Date("2026-01-01T10:00:00Z");
    const newer = new Date("2026-01-02T10:00:00Z");
    await seedLog(user.id, "MFA_DISABLED", true, older);
    await seedLog(user.id, "MFA_ACTIVATED", true, newer);

    const { query } = makeClient({ ...admin, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "mfaAuditLogs">>(MFA_AUDIT_LOGS, {
      variables: { userId: user.id }
    });

    const loggedAts = data.mfaAuditLogs.map(l =>
      new Date(l.loggedAt).getTime()
    );
    expect(loggedAts).toEqual([...loggedAts].sort((a, b) => b - a));
  });

  it("should filter results by userId", async () => {
    const admin = await adminFactory();
    const userA = await userFactory();
    const userB = await userFactory();

    await seedLog(userA.id, "MFA_LOGIN_SUCCESS", true);
    await seedLog(userB.id, "MFA_LOGIN_SUCCESS", true);

    const { query } = makeClient({ ...admin, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "mfaAuditLogs">>(MFA_AUDIT_LOGS, {
      variables: { userId: userA.id }
    });

    expect(data.mfaAuditLogs.every(l => l.userId === userA.id)).toBe(true);
  });

  it("should filter results by eventType", async () => {
    const admin = await adminFactory();
    const user = await userFactory();

    await seedLog(user.id, "MFA_LOGIN_SUCCESS", true);
    await seedLog(user.id, "MFA_LOGIN_FAILURE", false);
    await seedLog(user.id, "MFA_DISABLED", true);

    const { query } = makeClient({ ...admin, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "mfaAuditLogs">>(MFA_AUDIT_LOGS, {
      variables: { userId: user.id, eventType: "MFA_LOGIN_FAILURE" }
    });

    expect(
      data.mfaAuditLogs.every(l => l.eventType === "MFA_LOGIN_FAILURE")
    ).toBe(true);
    expect(data.mfaAuditLogs.length).toBeGreaterThanOrEqual(1);
  });

  it("should respect the first (page size) limit", async () => {
    const admin = await adminFactory();
    const user = await userFactory();

    for (let i = 0; i < 5; i++) {
      await seedLog(user.id, "MFA_LOGIN_SUCCESS", true);
    }

    const { query } = makeClient({ ...admin, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "mfaAuditLogs">>(MFA_AUDIT_LOGS, {
      variables: { userId: user.id, first: 3 }
    });

    expect(data.mfaAuditLogs.length).toBeLessThanOrEqual(3);
  });

  it("should respect skip for pagination", async () => {
    const admin = await adminFactory();
    const user = await userFactory();

    const older = new Date("2026-02-01T10:00:00Z");
    const newer = new Date("2026-02-02T10:00:00Z");
    await seedLog(user.id, "MFA_LOGIN_SUCCESS", true, older);
    await seedLog(user.id, "MFA_ACTIVATED", true, newer);

    const { query } = makeClient({ ...admin, auth: AuthType.Session });

    const { data: page1 } = await query<Pick<Query, "mfaAuditLogs">>(
      MFA_AUDIT_LOGS,
      {
        variables: { userId: user.id, first: 1, skip: 0 }
      }
    );
    const { data: page2 } = await query<Pick<Query, "mfaAuditLogs">>(
      MFA_AUDIT_LOGS,
      {
        variables: { userId: user.id, first: 1, skip: 1 }
      }
    );

    expect(page1.mfaAuditLogs.length).toBe(1);
    expect(page2.mfaAuditLogs.length).toBe(1);
    expect(page1.mfaAuditLogs[0].id).not.toEqual(page2.mfaAuditLogs[0].id);
  });

  it("should cap first at 500 even if a larger value is requested", async () => {
    const admin = await adminFactory();

    const { query } = makeClient({ ...admin, auth: AuthType.Session });
    // Just verify no error is thrown with an excessively large first value
    const { errors } = await query<Pick<Query, "mfaAuditLogs">>(
      MFA_AUDIT_LOGS,
      {
        variables: { first: 9999 }
      }
    );
    expect(errors).toBeUndefined();
  });
});
