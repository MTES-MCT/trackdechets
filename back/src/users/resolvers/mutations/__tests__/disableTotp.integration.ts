import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";
import { TOTP } from "totp-generator";
import { hash } from "bcrypt";
import type { Mutation } from "@td/codegen-back";

jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const DISABLE_TOTP = `
  mutation DisableTotp($code: String!) {
    disableTotp(code: $code) {
      id
    }
  }
`;

const SEED = "JBSWY3DPEHPK3PXP";

const flushAuditLog = () => new Promise(resolve => setTimeout(resolve, 100));

describe("Mutation.disableTotp — MFA audit log", () => {
  afterAll(resetDatabase);

  it("should write a MFA_DISABLED entry when TOTP code is valid", async () => {
    const user = await userFactory({
      totpSeed: SEED,
      totpActivatedAt: new Date()
    });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { otp } = TOTP.generate(SEED);
    const { errors } = await mutate<Pick<Mutation, "disableTotp">>(
      DISABLE_TOTP,
      {
        variables: { code: otp }
      }
    );
    expect(errors).toBeUndefined();

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_DISABLED" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(true);
  });

  it("should write MFA_RECOVERY_SUCCESS then MFA_DISABLED when a valid recovery code is used", async () => {
    const plainCode = "ABCDE-FGHIJ";
    const codeHash = await hash("ABCDEFGHIJ", 10);

    const user = await userFactory({
      totpSeed: SEED,
      totpActivatedAt: new Date()
    });
    await prisma.totpRecoveryCode.create({
      data: { userId: user.id, codeHash }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "disableTotp">>(
      DISABLE_TOTP,
      {
        variables: { code: plainCode }
      }
    );
    expect(errors).toBeUndefined();

    await flushAuditLog();

    const recoveryLog = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_SUCCESS" }
    });
    expect(recoveryLog).not.toBeNull();
    expect(recoveryLog!.success).toBe(true);

    const disabledLog = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_DISABLED" }
    });
    expect(disabledLog).not.toBeNull();
  });

  it("should write a MFA_RECOVERY_FAILURE entry when both TOTP and recovery code are invalid", async () => {
    const user = await userFactory({
      totpSeed: SEED,
      totpActivatedAt: new Date()
    });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate<Pick<Mutation, "disableTotp">>(
      DISABLE_TOTP,
      {
        variables: { code: "WRONG-WRONG" }
      }
    );
    expect(errors).not.toBeUndefined();

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_FAILURE" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(false);

    // MFA_DISABLED must NOT have been logged (action was blocked)
    const disabledLog = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_DISABLED" }
    });
    expect(disabledLog).toBeNull();
  });
});
