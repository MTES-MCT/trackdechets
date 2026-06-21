import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import type { Mutation } from "@td/codegen-back";
import { sendMail } from "../../../../mailer/mailing";
import { onTotpActivated, onTotpRecovery, renderMail } from "@td/mail";

jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const FINALIZE_MFA_SETUP = `
  mutation FinalizeMfaSetup {
    finalizeMfaSetup
  }
`;

async function createUserReadyToFinalize(
  overrides: Record<string, unknown> = {}
) {
  const user = await userFactory({
    totpSeed: "TESTSEED",
    totpActivatedAt: null,
    ...overrides
  });

  await prisma.totpRecoveryCode.create({
    data: { userId: user.id, codeHash: "fakehash" }
  });

  return user;
}

describe("Mutation.finalizeMfaSetup", () => {
  afterEach(async () => {
    await resetDatabase();
    (sendMail as jest.Mock).mockClear();
  });

  it("envoie onTotpActivated lors d'une activation MFA classique (mustReconfigureMfa=false)", async () => {
    const user = await createUserReadyToFinalize({ mustReconfigureMfa: false });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { data, errors } = await mutate<Pick<Mutation, "finalizeMfaSetup">>(
      FINALIZE_MFA_SETUP
    );

    expect(errors).toBeUndefined();
    expect(data.finalizeMfaSetup).toBe(true);

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(onTotpActivated, {
        to: [{ name: user.name, email: user.email }]
      })
    );
    expect(sendMail as jest.Mock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        subject: onTotpRecovery.subject
      })
    );

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(dbUser.totpActivatedAt).not.toBeNull();
    expect(dbUser.mustReconfigureMfa).toBe(false);
  });

  it("envoie onTotpRecovery lors d'une reconfiguration après code de récupération (mustReconfigureMfa=true)", async () => {
    const user = await createUserReadyToFinalize({ mustReconfigureMfa: true });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    // Précondition : mustReconfigureMfa vaut bien true avant la finalisation
    const userBeforeFinalize = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(userBeforeFinalize.mustReconfigureMfa).toBe(true);

    const { data, errors } = await mutate<Pick<Mutation, "finalizeMfaSetup">>(
      FINALIZE_MFA_SETUP
    );

    expect(errors).toBeUndefined();
    expect(data.finalizeMfaSetup).toBe(true);

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(onTotpRecovery, {
        to: [{ name: user.name, email: user.email }],
        variables: { name: user.name }
      })
    );
    expect(sendMail as jest.Mock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        subject: onTotpActivated.subject
      })
    );

    // Après finalizeMfaSetup : TOTP activé, mustReconfigureMfa toujours true
    // (il sera remis à false par completeMfaReconfiguration)
    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(dbUser.totpActivatedAt).not.toBeNull();
    expect(dbUser.mustReconfigureMfa).toBe(true);
  });

  it("mustReconfigureMfa est false en base après finalizeMfaSetup quand mustReconfigureMfa valait false", async () => {
    const user = await createUserReadyToFinalize({ mustReconfigureMfa: false });
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    await mutate<Pick<Mutation, "finalizeMfaSetup">>(FINALIZE_MFA_SETUP);

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    // mustReconfigureMfa n'est pas touché par finalizeMfaSetup : il reste false
    expect(dbUser.mustReconfigureMfa).toBe(false);
  });
});
