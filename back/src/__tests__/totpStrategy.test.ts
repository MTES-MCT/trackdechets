import { TotpStrategy } from "../auth/totpStrategy";
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

jest.mock("../utils", () => ({
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
  strategy.error = jest.fn();
  return { strategy, successSpy, failSpy };
}

describe("TotpStrategy", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  /**
   * Test 1 — Drift tolerance
   *
   * A code generated in the previous 30-second TOTP window must be accepted.
   * This handles users whose authenticator app clock is slightly behind.
   * Without this, a valid code shown right before a window rotation is rejected.
   */
  it("should accept a TOTP code generated in the previous 30-second window (drift tolerance)", async () => {
    // Fix Date.now to a stable value mid-window to avoid boundary flakiness
    const fixedNow = 1_700_000_015_000; // 15s into a 30s TOTP window
    jest.spyOn(Date, "now").mockReturnValue(fixedNow);

    const user = mockUser();
    findUniqueMock.mockResolvedValue(user);
    updateMock.mockResolvedValue(user); // resetLock call on success

    // Generate the previous window's OTP (same calculation as verifyTotp internally)
    const { otp: previousOtp } = TOTP.generate(SEED, {
      timestamp: fixedNow - 30 * 1000
    });

    const { strategy, successSpy, failSpy } = makeStrategy();
    await strategy.authenticate(mockRequest(previousOtp));

    expect(successSpy).toHaveBeenCalledWith(user);
    expect(failSpy).not.toHaveBeenCalled();
  });

  /**
   * Test 2 — Lock threshold boundary
   *
   * Fail 4 (totpFails was 3) → INVALID_TOTP, no lockout set in DB.
   * Fail 5 (totpFails was 4) → TOTP_LOCKOUT returned immediately, lockout ~5 min set in DB.
   *
   * This is the core rule of TRA-17922: lockout only triggers at the 5th consecutive fail.
   */
  it("should return INVALID_TOTP on fail 4 and TOTP_LOCKOUT on fail 5", async () => {
    const wrongCode = "000000";
    const timestamp = Date.now();

    // --- Fail 4 (totpFails was 3): no lockout expected ---
    const userAt3Fails = mockUser({ totpFails: 3, totpLockedUntil: null });
    findUniqueMock.mockResolvedValue(userAt3Fails);
    updateMock.mockResolvedValue({});

    const { strategy: s4, failSpy: fail4 } = makeStrategy();
    await s4.authenticate(mockRequest(wrongCode));

    expect(fail4).toHaveBeenCalledWith({ code: "INVALID_TOTP" }, 401);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totpFails: 4, totpLockedUntil: null })
      })
    );

    jest.clearAllMocks();

    // --- Fail 5 (totpFails was 4): 5-minute lockout expected ---
    const userAt4Fails = mockUser({ totpFails: 4, totpLockedUntil: null });
    findUniqueMock.mockResolvedValue(userAt4Fails);
    updateMock.mockResolvedValue({});

    const { strategy: s5, failSpy: fail5 } = makeStrategy();
    await s5.authenticate(mockRequest(wrongCode));

    expect(fail5).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "TOTP_LOCKOUT",
        lockout: expect.any(Number)
      }),
      401
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totpFails: 5,
          totpLockedUntil: expect.any(Date)
        })
      })
    );

    // Verify the lockout duration is ~5 minutes (≥ 299s to allow for test latency)
    const updateCall = updateMock.mock.calls[0][0];
    const lockSeconds =
      (updateCall.data.totpLockedUntil.getTime() - timestamp) / 1000;
    expect(lockSeconds).toBeGreaterThanOrEqual(299);
    expect(lockSeconds).toBeLessThan(310); // sanity upper bound
  });
});
