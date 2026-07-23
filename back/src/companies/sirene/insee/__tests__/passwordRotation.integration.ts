jest.mock("../token");
jest.mock("../passwordRenewal");
jest.mock("../password");
jest.mock("../../../../common/scalingo");

import { clearToken, generateToken } from "../token";
import {
  InseePasswordRenewalError,
  renewInseePassword
} from "../passwordRenewal";
import { generateInseePassword } from "../password";
import {
  restartScalingoApplication,
  updateScalingoEnvironmentVariable
} from "../../../../common/scalingo";
import { rotateInseePasswordIfNeeded } from "../passwordRotation";

const mockedGenerateToken = jest.mocked(generateToken);
const mockedClearToken = jest.mocked(clearToken);
const mockedRenewPassword = jest.mocked(renewInseePassword);
const mockedGeneratePassword = jest.mocked(generateInseePassword);
const mockedUpdateVariable = jest.mocked(updateScalingoEnvironmentVariable);
const mockedRestart = jest.mocked(restartScalingoApplication);

function createToken(pwdChangedTime: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
    "base64url"
  );

  const payload = Buffer.from(JSON.stringify({ pwdChangedTime })).toString(
    "base64url"
  );

  return `${header}.${payload}.signature`;
}

describe("rotateInseePasswordIfNeeded", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    process.env.INSEE_PASSWORD = "old-password";

    process.env.INSEE_PASSWORD_ROTATION_ENABLED = "true";
  });

  it("ne fait rien avant 80 jours", async () => {
    mockedGenerateToken.mockResolvedValue(createToken("20260701120000Z"));

    const result = await rotateInseePasswordIfNeeded(
      new Date("2026-07-22T12:00:00.000Z")
    );

    expect(result.status).toBe("skipped");
    expect(mockedRenewPassword).not.toHaveBeenCalled();
    expect(mockedUpdateVariable).not.toHaveBeenCalled();
  });

  it("renouvelle et met à jour Scalingo à partir de 80 jours", async () => {
    mockedGenerateToken
      .mockResolvedValueOnce(createToken("20260501120000Z"))
      .mockResolvedValueOnce(createToken("20260722120000Z"));

    mockedGeneratePassword.mockReturnValue("NewPassword-123456789!");

    mockedRenewPassword.mockResolvedValue();
    mockedUpdateVariable.mockResolvedValue();
    mockedClearToken.mockResolvedValue();
    mockedRestart.mockResolvedValue();

    const result = await rotateInseePasswordIfNeeded(
      new Date("2026-07-22T12:00:00.000Z")
    );

    expect(result.status).toBe("rotated");

    expect(mockedRenewPassword).toHaveBeenCalledWith({
      token: expect.any(String),
      oldPassword: "old-password",
      newPassword: "NewPassword-123456789!"
    });

    expect(mockedUpdateVariable).toHaveBeenCalledWith(
      "INSEE_PASSWORD",
      "NewPassword-123456789!"
    );

    expect(mockedClearToken).toHaveBeenCalled();
    expect(mockedRestart).toHaveBeenCalled();
  });

  it("ne met pas à jour Scalingo en cas de rejet INSEE", async () => {
    mockedGenerateToken.mockResolvedValue(createToken("20260501120000Z"));

    mockedGeneratePassword.mockReturnValue("NewPassword-123456789!");

    mockedRenewPassword.mockRejectedValue(
      new InseePasswordRenewalError("L'INSEE a refusé le renouvellement", 1)
    );

    await expect(
      rotateInseePasswordIfNeeded(new Date("2026-07-22T12:00:00.000Z"))
    ).rejects.toThrow();

    expect(mockedUpdateVariable).not.toHaveBeenCalled();
    expect(mockedRestart).not.toHaveBeenCalled();
  });

  it("synchronise Scalingo si le renouvellement a réussi malgré un timeout", async () => {
    mockedGenerateToken
      // Token initial
      .mockResolvedValueOnce(createToken("20260501120000Z"))
      // resolveAmbiguousRenewal teste le nouveau mot de passe
      .mockResolvedValueOnce(createToken("20260722120000Z"))
      // Vérification finale
      .mockResolvedValueOnce(createToken("20260722120000Z"));

    mockedGeneratePassword.mockReturnValue("NewPassword-123456789!");

    mockedRenewPassword.mockRejectedValue(new Error("ETIMEDOUT"));

    mockedUpdateVariable.mockResolvedValue();
    mockedClearToken.mockResolvedValue();
    mockedRestart.mockResolvedValue();

    const result = await rotateInseePasswordIfNeeded(
      new Date("2026-07-22T12:00:00.000Z")
    );

    expect(result.status).toBe("rotated");

    expect(mockedUpdateVariable).toHaveBeenCalledWith(
      "INSEE_PASSWORD",
      "NewPassword-123456789!"
    );
  });

  it("ne modifie pas Scalingo si l'ancien mot de passe reste actif après un timeout", async () => {
    mockedGenerateToken
      // Token initial
      .mockResolvedValueOnce(createToken("20260501120000Z"))
      // Test nouveau mot de passe
      .mockRejectedValueOnce(new Error("HTTP 401"))
      // Test ancien mot de passe
      .mockResolvedValueOnce(createToken("20260501120000Z"));

    mockedGeneratePassword.mockReturnValue("NewPassword-123456789!");

    mockedRenewPassword.mockRejectedValue(new Error("ETIMEDOUT"));

    await expect(
      rotateInseePasswordIfNeeded(new Date("2026-07-22T12:00:00.000Z"))
    ).rejects.toThrow("l'ancien mot de passe reste actif");

    expect(mockedUpdateVariable).not.toHaveBeenCalled();
    expect(mockedRestart).not.toHaveBeenCalled();
  });

  it("restaure l'ancien mot de passe si Scalingo ne peut pas être mis à jour", async () => {
    mockedGenerateToken
      // Token initial
      .mockResolvedValueOnce(createToken("20260501120000Z"))
      // Vérification du nouveau mot de passe
      .mockResolvedValueOnce(createToken("20260722120000Z"))
      // Vérification de l'ancien mot de passe après rollback
      .mockResolvedValueOnce(createToken("20260722120500Z"));

    mockedGeneratePassword.mockReturnValue("NewPassword-123456789!");

    mockedRenewPassword.mockResolvedValue();

    mockedUpdateVariable.mockRejectedValue(new Error("Scalingo indisponible"));

    await expect(
      rotateInseePasswordIfNeeded(new Date("2026-07-22T12:00:00.000Z"))
    ).rejects.toThrow("l'ancien mot de passe INSEE a été restauré");

    expect(mockedRenewPassword).toHaveBeenNthCalledWith(2, {
      token: expect.any(String),
      oldPassword: "NewPassword-123456789!",
      newPassword: "old-password"
    });

    expect(mockedRestart).not.toHaveBeenCalled();
  });
});
