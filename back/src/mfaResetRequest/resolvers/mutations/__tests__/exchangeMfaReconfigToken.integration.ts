import crypto from "crypto";
import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userFactory } from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { server, getServerDataloaders } from "../../../../server";
import { print } from "graphql";
import { subHours, addHours } from "date-fns";

const EXCHANGE_MFA_RECONFIG_TOKEN = gql`
  mutation ExchangeMfaReconfigToken($token: String!, $password: String!) {
    exchangeMfaReconfigToken(token: $token, password: $password) {
      id
      mustReconfigureMfa
    }
  }
`;

const VALID_PASSWORD = "pass";

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function createValidToken(
  userId: string,
  opts: { used?: boolean; expiresAt?: Date } = {}
) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  await prisma.mfaReconfigToken.create({
    data: {
      token: tokenHash,
      tokenExpires: opts.expiresAt ?? addHours(new Date(), 24),
      used: opts.used ?? false,
      userId
    }
  });
  return rawToken;
}

function makeUnauthenticatedClient() {
  const logInMock = jest.fn((user, cb) => cb(null));

  async function mutate<T extends object = Record<string, unknown>>(
    operation: ReturnType<typeof gql>,
    { variables }: { variables?: Record<string, unknown> } = {}
  ) {
    const { body } = await server.executeOperation<T>(
      { query: print(operation), variables },
      {
        contextValue: {
          req: {
            logIn: logInMock,
            session: {
              regenerate: (cb: () => void) => cb(),
              save: (cb: () => void) => cb()
            }
          },
          res: { locals: {} },
          dataloaders: getServerDataloaders()
        } as any
      }
    );
    if (body.kind !== "single") throw new Error("Expected single result");
    return {
      result: JSON.parse(JSON.stringify(body.singleResult)) as {
        data?: T;
        errors?: Array<{ message: string }>;
      },
      logInMock
    };
  }

  return { mutate };
}

describe("Mutation exchangeMfaReconfigToken", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
  });

  it("token valide : établit une session et retourne mustReconfigureMfa=true", async () => {
    const user = await userFactory({
      mustReconfigureMfa: true,
      mfaResetSuspended: true,
      totpSeed: null
    });
    const rawToken = await createValidToken(user.id);

    const { mutate } = makeUnauthenticatedClient();
    const { result, logInMock } = await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: rawToken, password: VALID_PASSWORD }
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.exchangeMfaReconfigToken?.id).toBe(user.id);
    expect(result.data?.exchangeMfaReconfigToken?.mustReconfigureMfa).toBe(
      true
    );

    // Session établie via req.logIn
    expect(logInMock).toHaveBeenCalledTimes(1);
  });

  it("token valide : lève mfaResetSuspended et marque le token comme utilisé", async () => {
    const user = await userFactory({
      mustReconfigureMfa: true,
      mfaResetSuspended: true,
      totpSeed: null
    });
    const rawToken = await createValidToken(user.id);

    const { mutate } = makeUnauthenticatedClient();
    await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: rawToken, password: VALID_PASSWORD }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    expect(updatedUser!.mfaResetSuspended).toBe(false);

    const storedToken = await prisma.mfaReconfigToken.findFirst({
      where: { userId: user.id }
    });
    expect(storedToken!.used).toBe(true);
  });

  it("token invalide (hash inconnu) → erreur explicite, pas de session", async () => {
    const { mutate } = makeUnauthenticatedClient();
    const { result, logInMock } = await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: "a".repeat(64), password: VALID_PASSWORD }
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/invalide/i);
    expect(logInMock).not.toHaveBeenCalled();
  });

  it("token expiré → erreur explicite avec mention support", async () => {
    const user = await userFactory({
      mustReconfigureMfa: true,
      mfaResetSuspended: true
    });
    const rawToken = await createValidToken(user.id, {
      expiresAt: subHours(new Date(), 1)
    });

    const { mutate } = makeUnauthenticatedClient();
    const { result, logInMock } = await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: rawToken, password: VALID_PASSWORD }
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/expiré/i);
    expect(logInMock).not.toHaveBeenCalled();
  });

  it("token déjà utilisé → erreur explicite, pas de nouvelle session", async () => {
    const user = await userFactory({
      mustReconfigureMfa: true,
      mfaResetSuspended: true
    });
    const rawToken = await createValidToken(user.id, { used: true });

    const { mutate } = makeUnauthenticatedClient();
    const { result, logInMock } = await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: rawToken, password: VALID_PASSWORD }
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/déjà été utilisé/i);
    expect(logInMock).not.toHaveBeenCalled();
  });

  it("token valide mais utilisateur pas en état reconfiguration → erreur, token invalidé", async () => {
    // Utilisateur normal, mustReconfigureMfa=false
    const user = await userFactory({
      mustReconfigureMfa: false,
      mfaResetSuspended: false
    });
    const rawToken = await createValidToken(user.id);

    const { mutate } = makeUnauthenticatedClient();
    const { result, logInMock } = await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: rawToken, password: VALID_PASSWORD }
    });

    expect(result.errors).toBeDefined();
    expect(logInMock).not.toHaveBeenCalled();

    // Le token est invalidé par sécurité
    const storedToken = await prisma.mfaReconfigToken.findFirst({
      where: { userId: user.id }
    });
    expect(storedToken!.used).toBe(true);
  });

  it("token ne peut pas être réutilisé après un premier échange réussi", async () => {
    const user = await userFactory({
      mustReconfigureMfa: true,
      mfaResetSuspended: true,
      totpSeed: null
    });
    const rawToken = await createValidToken(user.id);
    const { mutate } = makeUnauthenticatedClient();

    // Premier échange : succès
    const { result: first } = await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: rawToken, password: VALID_PASSWORD }
    });
    expect(first.errors).toBeUndefined();

    // Second échange avec le même token : refusé
    const { result: second } = await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: rawToken, password: VALID_PASSWORD }
    });
    expect(second.errors).toBeDefined();
    expect(second.errors![0].message).toMatch(/déjà été utilisé/i);
  });

  it("mot de passe incorrect : refuse la session sans consommer le token", async () => {
    const user = await userFactory({
      mustReconfigureMfa: true,
      mfaResetSuspended: true,
      totpSeed: null
    });
    const rawToken = await createValidToken(user.id);

    const { mutate } = makeUnauthenticatedClient();
    const { result, logInMock } = await mutate(EXCHANGE_MFA_RECONFIG_TOKEN, {
      variables: { token: rawToken, password: "wrong-password" }
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/mot de passe incorrect/i);
    expect(logInMock).not.toHaveBeenCalled();

    const storedToken = await prisma.mfaReconfigToken.findFirst({
      where: { userId: user.id }
    });
    expect(storedToken!.used).toBe(false);
  });
});
