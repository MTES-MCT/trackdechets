/**
 * Tests unitaires du check mfaResetSuspended dans la TotpStrategy.
 *
 * Le check dans la LocalStrategy (auth.ts) est couvert par les tests d'intégration
 * de createMfaResetRequest (le compte ne peut pas se connecter après création).
 */
import { TotpStrategy } from "../../../../auth/totpStrategy";
import { TOTP } from "totp-generator";
import { Request } from "express";
import { addMinutes } from "date-fns";
import { User } from "@td/prisma";

const findUniqueMock = jest.fn();
const updateMock = jest.fn();

jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args)
    }
  }
}));

jest.mock("../../../../utils", () => ({
  sanitizeEmail: (email: string) => email.toLowerCase().trim()
}));

const SEED = "JBSWY3DPEHPK3PXP";

const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: "user-id-1",
    email: "test@trackdechets.fr",
    password: "hashed",
    name: "Test User",
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    isAdmin: false,
    totpSeed: SEED,
    totpActivatedAt: new Date(),
    totpFails: 0,
    totpLockedUntil: null,
    mfaResetSuspended: false,
    mustReconfigureMfa: false,
    recoveryFails: 0,
    recoveryLockedUntil: null,
    ...overrides
  } as User);

const mockRequest = (totp: string): Request =>
  ({
    body: { totp },
    session: {
      preloggedUser: {
        userEmail: "test@trackdechets.fr",
        expire: addMinutes(new Date(), 5)
      }
    }
  } as unknown as Request);

function makeStrategy() {
  const strategy = new TotpStrategy();
  const successSpy = jest.fn();
  const failSpy = jest.fn();
  strategy.success = successSpy;
  strategy.fail = failSpy;
  return { strategy, successSpy, failSpy };
}

describe("TotpStrategy — mfaResetSuspended", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refuse l'authentification TOTP si le compte est suspendu (mfaResetSuspended = true)", async () => {
    const user = mockUser({ mfaResetSuspended: true });
    findUniqueMock.mockResolvedValue(user);

    const { otp } = TOTP.generate(SEED);
    const req = mockRequest(otp);
    const { strategy, failSpy, successSpy } = makeStrategy();

    await strategy.authenticate(req);

    expect(failSpy).toHaveBeenCalledWith(
      { code: "MFA_RESET_IN_PROGRESS" },
      401
    );
    expect(successSpy).not.toHaveBeenCalled();
  });

  it("accepte l'authentification TOTP normalement si mfaResetSuspended = false", async () => {
    const user = mockUser({ mfaResetSuspended: false });
    findUniqueMock.mockResolvedValue(user);
    updateMock.mockResolvedValue(user);

    const { otp } = TOTP.generate(SEED);
    const req = mockRequest(otp);
    const { strategy, successSpy, failSpy } = makeStrategy();

    await strategy.authenticate(req);

    expect(successSpy).toHaveBeenCalledWith(user);
    expect(failSpy).not.toHaveBeenCalled();
  });

  it("le check mfaResetSuspended est effectué avant le check de lockout TOTP", async () => {
    // Un compte suspendu ET locké → doit retourner MFA_RESET_IN_PROGRESS (pas TOTP_LOCKOUT)
    const user = mockUser({
      mfaResetSuspended: true,
      totpLockedUntil: addMinutes(new Date(), 5) // lockout actif
    });
    findUniqueMock.mockResolvedValue(user);

    const { otp } = TOTP.generate(SEED);
    const req = mockRequest(otp);
    const { strategy, failSpy } = makeStrategy();

    await strategy.authenticate(req);

    expect(failSpy).toHaveBeenCalledWith(
      { code: "MFA_RESET_IN_PROGRESS" },
      401
    );
    // TOTP_LOCKOUT ne doit pas être retourné
    expect(failSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ code: "TOTP_LOCKOUT" }),
      expect.anything()
    );
  });
});
