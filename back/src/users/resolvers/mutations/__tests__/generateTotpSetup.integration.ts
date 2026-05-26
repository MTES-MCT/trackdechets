import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";

const GENERATE_TOTP_SETUP = `
  mutation GenerateTotpSetup {
    generateTotpSetup {
      secret
      qrCodeUrl
    }
  }
`;

// Allow fire-and-forget prisma write to settle
const flushAuditLog = () => new Promise(resolve => setTimeout(resolve, 100));

describe("Mutation.generateTotpSetup — MFA audit log", () => {
  afterAll(resetDatabase);

  it("should write a MFA_SETUP_INITIATED entry in the audit log on success", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate<Pick<Mutation, "generateTotpSetup">>(
      GENERATE_TOTP_SETUP
    );
    expect(errors).toBeUndefined();

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_SETUP_INITIATED" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(true);
  });

  it("should not write an audit log when unauthenticated", async () => {
    const countBefore = await prisma.mfaAuditLog.count({
      where: { eventType: "MFA_SETUP_INITIATED" }
    });

    const { mutate } = makeClient(null);
    const { errors } = await mutate<Pick<Mutation, "generateTotpSetup">>(
      GENERATE_TOTP_SETUP
    );
    expect(errors).not.toBeUndefined();

    await flushAuditLog();

    const countAfter = await prisma.mfaAuditLog.count({
      where: { eventType: "MFA_SETUP_INITIATED" }
    });
    expect(countAfter).toBe(countBefore);
  });
});
