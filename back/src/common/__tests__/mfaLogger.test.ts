import { logMfaEvent } from "../mfaLogger";

const createMock = jest.fn();
const loggerInfoMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.mock("@td/prisma", () => ({
  prisma: {
    mfaAuditLog: {
      create: (...args: unknown[]) => createMock(...args)
    }
  }
}));

jest.mock("@td/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args)
  }
}));

describe("logMfaEvent", () => {
  beforeEach(() => {
    createMock.mockReset();
    loggerInfoMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it("should call logger.info with the correct structured fields", () => {
    createMock.mockResolvedValue({});

    logMfaEvent({
      eventType: "MFA_LOGIN_SUCCESS",
      userId: "u1",
      success: true,
      ip: "1.2.3.4"
    });

    expect(loggerInfoMock).toHaveBeenCalledWith("mfa_event", {
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      mfa_event_type: "MFA_LOGIN_SUCCESS",
      user_id: "u1",
      success: true,
      ip: "1.2.3.4"
    });
  });

  it("should store null for ip when ip is omitted", () => {
    createMock.mockResolvedValue({});

    logMfaEvent({ eventType: "MFA_DISABLED", userId: "u2", success: true });

    expect(loggerInfoMock).toHaveBeenCalledWith(
      "mfa_event",
      expect.objectContaining({ ip: null })
    );
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ ip: null })
    });
  });

  it("should persist the event to DB via prisma.mfaAuditLog.create", () => {
    createMock.mockResolvedValue({});

    logMfaEvent({
      eventType: "MFA_ACTIVATED",
      userId: "u3",
      success: true,
      ip: "10.0.0.1"
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        userId: "u3",
        eventType: "MFA_ACTIVATED",
        success: true,
        ip: "10.0.0.1"
      }
    });
  });

  it("should catch DB errors without throwing (fire-and-forget)", async () => {
    const dbError = new Error("DB write failed");
    createMock.mockRejectedValue(dbError);

    // Must not throw
    expect(() =>
      logMfaEvent({
        eventType: "MFA_LOGIN_FAILURE",
        userId: "u4",
        success: false
      })
    ).not.toThrow();

    // Let the rejected promise settle
    await new Promise(resolve => setImmediate(resolve));

    expect(loggerErrorMock).toHaveBeenCalledWith("mfa_audit_log_write_error", {
      error: "DB write failed"
    });
  });
});
