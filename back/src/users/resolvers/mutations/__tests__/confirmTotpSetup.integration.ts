import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";
import { TOTP } from "totp-generator";
import type { Mutation } from "@td/codegen-back";

jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const CONFIRM_TOTP_SETUP = `
  mutation ConfirmTotpSetup($code: String!) {
    confirmTotpSetup(code: $code) {
      codes
    }
  }
`;

const SEED = "JBSWY3DPEHPK3PXP";

const flushAuditLog = () => new Promise(resolve => setTimeout(resolve, 100));

describe("Mutation.confirmTotpSetup — MFA audit log", () => {
  afterAll(resetDatabase);

  it("should write a MFA_ACTIVATED entry when the code is valid", async () => {
    const user = await userFactory({ totpSeed: SEED });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { otp } = TOTP.generate(SEED);
    const { errors } = await mutate<Pick<Mutation, "confirmTotpSetup">>(
      CONFIRM_TOTP_SETUP,
      {
        variables: { code: otp }
      }
    );
    expect(errors).toBeUndefined();

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_ACTIVATED" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(true);
  });

  it("should write a MFA_ACTIVATION_ABANDONED entry when the code is invalid", async () => {
    const user = await userFactory({ totpSeed: SEED });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate<Pick<Mutation, "confirmTotpSetup">>(
      CONFIRM_TOTP_SETUP,
      {
        variables: { code: "000000" }
      }
    );
    expect(errors).not.toBeUndefined();

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_ACTIVATION_ABANDONED" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(false);
  });

  it("should not write any log when no totpSeed is set (pre-condition error)", async () => {
    const user = await userFactory({ totpSeed: null });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate<Pick<Mutation, "confirmTotpSetup">>(
      CONFIRM_TOTP_SETUP,
      {
        variables: { code: "123456" }
      }
    );
    expect(errors).not.toBeUndefined();

    await flushAuditLog();

    const count = await prisma.mfaAuditLog.count({
      where: { userId: user.id }
    });
    expect(count).toBe(0);
  });
});

describe("Mutation.confirmTotpSetup — recovery codes format", () => {
  afterAll(resetDatabase);

  it("generates exactly 5 recovery codes of 20 alphanumeric characters formatted as 4 groups of 5", async () => {
    const user = await userFactory({ totpSeed: SEED });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { otp } = TOTP.generate(SEED);
    const { data, errors } = await mutate<Pick<Mutation, "confirmTotpSetup">>(
      CONFIRM_TOTP_SETUP,
      {
        variables: { code: otp }
      }
    );
    expect(errors).toBeUndefined();

    const codes = data!.confirmTotpSetup.codes;
    expect(codes).toHaveLength(5);

    const codePattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    codes.forEach(code => {
      expect(code).toMatch(codePattern);
      expect(code.replace(/-/g, "")).toHaveLength(20);
    });

    // all codes must be unique
    expect(new Set(codes).size).toBe(5);

    // codes must only be stored as bcrypt hashes, never in clear
    const storedCodes = await prisma.totpRecoveryCode.findMany({
      where: { userId: user.id }
    });
    expect(storedCodes).toHaveLength(5);
    storedCodes.forEach(stored => {
      expect(codes).not.toContain(stored.codeHash);
      expect(stored.codeHash.startsWith("$2b$")).toBe(true);
    });
  });
});
