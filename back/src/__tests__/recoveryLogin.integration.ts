import supertest from "supertest";
import { hash } from "bcrypt";
import { resetDatabase } from "../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { app, sess } from "../server";
import { userFactory } from "./factories";
import { addSeconds } from "date-fns";
import { sendMail } from "../mailer/mailing";

jest.mock("../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const { UI_HOST } = process.env;
const request = supertest(app);

const cookieRegExp = new RegExp(
  `${sess.name}=(.+); Domain=.+; Path=/; Expires=.+; HttpOnly`
);

async function createUserWithRecoveryCode(
  plainCode = "ABCDE-FGHIJ",
  overrides: Record<string, unknown> = {}
) {
  const normalized = plainCode.replace(/-/g, "").toUpperCase();
  const codeHash = await hash(normalized, 10);

  const user = await userFactory({
    totpSeed: "ABCD",
    totpActivatedAt: new Date(),
    ...overrides
  });

  await prisma.totpRecoveryCode.create({
    data: { userId: user.id, codeHash }
  });

  return { user, plainCode };
}

async function doLogin(email: string) {
  const login = await request
    .post("/login")
    .send(`email=${email}`)
    .send("password=pass");

  const sessionCookie = login.header["set-cookie"][0];
  const cookieValue = sessionCookie.match(cookieRegExp)?.[1];
  return cookieValue!;
}

describe("POST /recovery-login", () => {
  afterEach(async () => {
    await resetDatabase();
    (sendMail as jest.Mock).mockClear();
  });

  it("redirects to login when there is no preloggedUser session", async () => {
    const res = await request
      .post("/recovery-login")
      .send("recoveryCode=ABCDE-FGHIJ");

    expect(res.status).toBe(302);
    expect(res.header.location).toContain(
      "errorCode=TOTP_TIMEOUT_OR_MISSING_SESSION"
    );
  });

  it("logs the user in with a valid recovery code, revokes TOTP and sets mustReconfigureMfa", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    const res = await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .set("Cookie", `${sess.name}=${cookie}`);

    // should redirect to home (user is now connected)
    expect(res.status).toBe(302);
    expect(res.header.location).toBe(`http://${UI_HOST}/`);

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // TOTP must be revoked
    expect(updatedUser.totpSeed).toBeNull();
    expect(updatedUser.totpActivatedAt).toBeNull();
    // reconfiguration flag must be active
    expect(updatedUser.mustReconfigureMfa).toBe(true);
    // recovery counters must be reset
    expect(updatedUser.recoveryFails).toBe(0);
    expect(updatedUser.recoveryLockedUntil).toBeNull();

    // all recovery codes must be deleted
    const remainingCodes = await prisma.totpRecoveryCode.findMany({
      where: { userId: user.id }
    });
    expect(remainingCodes).toHaveLength(0);
  });

  it("n'envoie aucun email lors de la validation du code de récupération", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(sendMail as jest.Mock).not.toHaveBeenCalled();
  });

  it("is case-insensitive and ignores dashes", async () => {
    const { user } = await createUserWithRecoveryCode("ABCDE-FGHIJ");
    const cookie = await doLogin(user.email);

    // Submit the code in lowercase without dashes
    const res = await request
      .post("/recovery-login")
      .send("recoveryCode=abcdefghij")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);
    expect(res.header.location).toBe(`http://${UI_HOST}/`);
  });

  it("returns INVALID_RECOVERY_CODE for a wrong code (fail 1 of 3, no lockout)", async () => {
    const { user } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    const res = await request
      .post("/recovery-login")
      .send("recoveryCode=WRONG-CODE")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);
    expect(res.header.location).toContain("errorCode=INVALID_RECOVERY_CODE");
    expect(res.header.location).not.toContain("RECOVERY_LOCKOUT");

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(updatedUser.recoveryFails).toBe(1);
    expect(updatedUser.recoveryLockedUntil).toBeNull();
  });

  it("triggers lockout on 3rd consecutive invalid code", async () => {
    const { user } = await createUserWithRecoveryCode("ABCDE-FGHIJ", {
      recoveryFails: 2
    });
    const cookie = await doLogin(user.email);
    const before = new Date();

    const res = await request
      .post("/recovery-login")
      .send("recoveryCode=WRONG-CODE")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);
    expect(res.header.location).toContain("errorCode=RECOVERY_LOCKOUT");
    expect(res.header.location).toContain("lockout=");

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(updatedUser.recoveryFails).toBe(3);
    expect(updatedUser.recoveryLockedUntil).not.toBeNull();
    // lockout must be ~1h from now
    expect(
      updatedUser.recoveryLockedUntil!.getTime() - before.getTime() >= 3_600_000
    ).toBe(true);
  });

  it("returns attemptsRemaining=2 on the 1st invalid attempt", async () => {
    const { user } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    const res = await request
      .post("/recovery-login")
      .send("recoveryCode=WRONG-CODE")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.header.location).toContain("attemptsRemaining=2");
  });

  it("returns attemptsRemaining=1 on the 2nd invalid attempt", async () => {
    const { user } = await createUserWithRecoveryCode("ABCDE-FGHIJ", {
      recoveryFails: 1
    });
    const cookie = await doLogin(user.email);

    const res = await request
      .post("/recovery-login")
      .send("recoveryCode=WRONG-CODE")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.header.location).toContain("attemptsRemaining=1");
  });

  it("blocks any attempt during an active lockout", async () => {
    const recoveryLockedUntil = addSeconds(new Date(), 30);
    const { user, plainCode } = await createUserWithRecoveryCode(
      "ABCDE-FGHIJ",
      {
        recoveryFails: 3,
        recoveryLockedUntil
      }
    );
    const cookie = await doLogin(user.email);

    // Even the correct code must be rejected
    const res = await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);
    expect(res.header.location).toContain("errorCode=RECOVERY_LOCKOUT");

    // User must not be logged in and TOTP must remain intact
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(updatedUser.totpSeed).not.toBeNull();
    expect(updatedUser.mustReconfigureMfa).toBe(false);
  });

  it("regenerates the session on successful recovery login (prevents session fixation)", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    const res = await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);

    // A new Set-Cookie header must be present with a different session ID
    const newCookieHeader = res.header["set-cookie"]?.[0];
    expect(newCookieHeader).toBeDefined();
    const newCookieValue = newCookieHeader?.match(cookieRegExp)?.[1];
    expect(newCookieValue).toBeDefined();
    expect(newCookieValue).not.toBe(cookie);
  });

  it("recoveryAction=TEMPORARY with remaining codes: connects normally without resetting TOTP", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    // Second valid recovery code so at least one remains after consumption
    await prisma.totpRecoveryCode.create({
      data: { userId: user.id, codeHash: await hash("OTHERCODE", 10) }
    });
    const cookie = await doLogin(user.email);

    const res = await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .send("recoveryAction=TEMPORARY")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);
    expect(res.header.location).toBe(`http://${UI_HOST}/`);

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    // TOTP must remain intact
    expect(updatedUser.totpSeed).not.toBeNull();
    expect(updatedUser.mustReconfigureMfa).toBe(false);
    expect(updatedUser.recoveryFails).toBe(0);
    expect(updatedUser.recoveryLockedUntil).toBeNull();

    // The used code is marked as used, the other one remains valid
    const codes = await prisma.totpRecoveryCode.findMany({
      where: { userId: user.id }
    });
    expect(codes).toHaveLength(2);
    const usedCodes = codes.filter(c => c.usedAt !== null);
    const validCodes = codes.filter(c => c.usedAt === null);
    expect(usedCodes).toHaveLength(1);
    expect(validCodes).toHaveLength(1);
  });

  it("recoveryAction=TEMPORARY on the last valid code falls back to a full MFA reset", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    const res = await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .send("recoveryAction=TEMPORARY")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);
    expect(res.header.location).toBe(`http://${UI_HOST}/`);

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(updatedUser.totpSeed).toBeNull();
    expect(updatedUser.totpActivatedAt).toBeNull();
    expect(updatedUser.mustReconfigureMfa).toBe(true);

    const remainingCodes = await prisma.totpRecoveryCode.findMany({
      where: { userId: user.id }
    });
    expect(remainingCodes).toHaveLength(0);
  });

  it("recoveryAction=RESET revokes TOTP even if other codes remain valid", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    await prisma.totpRecoveryCode.create({
      data: { userId: user.id, codeHash: await hash("OTHERCODE", 10) }
    });
    const cookie = await doLogin(user.email);

    const res = await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .send("recoveryAction=RESET")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(updatedUser.totpSeed).toBeNull();
    expect(updatedUser.mustReconfigureMfa).toBe(true);

    const remainingCodes = await prisma.totpRecoveryCode.findMany({
      where: { userId: user.id }
    });
    expect(remainingCodes).toHaveLength(0);
  });

  it("rejects a code that has already been deleted (already used)", async () => {
    const { user } = await createUserWithRecoveryCode("ABCDE-FGHIJ");
    const cookie = await doLogin(user.email);

    // Simulate an already-consumed code by deleting it directly from DB
    await prisma.totpRecoveryCode.deleteMany({ where: { userId: user.id } });

    const res = await request
      .post("/recovery-login")
      .send("recoveryCode=ABCDE-FGHIJ")
      .set("Cookie", `${sess.name}=${cookie}`);

    expect(res.status).toBe(302);
    expect(res.header.location).toContain("errorCode=INVALID_RECOVERY_CODE");
  });

  // ── MFA Audit Logs ───────────────────────────────────────────────────────────

  const flushAuditLog = () => new Promise(resolve => setTimeout(resolve, 100));

  it("log MFA_RECOVERY_SUCCESS écrit quand le code de récupération est valide", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .set("Cookie", `${sess.name}=${cookie}`);

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_SUCCESS" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(true);
    expect(log!.userId).toBe(user.id);
  });

  it("log MFA_RECOVERY_FAILURE écrit quand le code est invalide (avant verrouillage)", async () => {
    const { user } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send("recoveryCode=WRONG-CODE")
      .set("Cookie", `${sess.name}=${cookie}`);

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_FAILURE" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(false);
    expect(log!.userId).toBe(user.id);
  });

  it("log MFA_RECOVERY_LOCKOUT_TRIGGERED écrit à la 3e tentative invalide", async () => {
    const { user } = await createUserWithRecoveryCode("ABCDE-FGHIJ", {
      recoveryFails: 2
    });
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send("recoveryCode=WRONG-CODE")
      .set("Cookie", `${sess.name}=${cookie}`);

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_LOCKOUT_TRIGGERED" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(false);
    expect(log!.userId).toBe(user.id);

    // MFA_RECOVERY_FAILURE ne doit PAS être écrit à la tentative qui déclenche le blocage
    const failureLog = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_FAILURE" }
    });
    expect(failureLog).toBeNull();
  });

  it("log MFA_RECOVERY_LOCKOUT_LIFTED écrit quand le code est valide après expiration du blocage", async () => {
    // Blocage expiré : recoveryLockedUntil dans le passé
    const expiredLockout = new Date(Date.now() - 1000);
    const { user, plainCode } = await createUserWithRecoveryCode(
      "ABCDE-FGHIJ",
      {
        recoveryFails: 3,
        recoveryLockedUntil: expiredLockout
      }
    );
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .set("Cookie", `${sess.name}=${cookie}`);

    await flushAuditLog();

    const liftedLog = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_LOCKOUT_LIFTED" }
    });
    expect(liftedLog).not.toBeNull();
    expect(liftedLog!.success).toBe(true);

    // MFA_RECOVERY_SUCCESS doit aussi être écrit
    const successLog = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_SUCCESS" }
    });
    expect(successLog).not.toBeNull();
  });

  it("log MFA_RECOVERY_LOCKOUT_LIFTED absent si l'utilisateur n'avait pas de blocage précédent", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .set("Cookie", `${sess.name}=${cookie}`);

    await flushAuditLog();

    const liftedLog = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_LOCKOUT_LIFTED" }
    });
    expect(liftedLog).toBeNull();
  });

  it("log MFA_RECOVERY_TEMP_LOGIN_SUCCESS écrit lors d'une connexion temporaire avec codes restants", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    await prisma.totpRecoveryCode.create({
      data: { userId: user.id, codeHash: await hash("OTHERCODE", 10) }
    });
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .send("recoveryAction=TEMPORARY")
      .set("Cookie", `${sess.name}=${cookie}`);

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_TEMP_LOGIN_SUCCESS" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(true);
  });

  it("log MFA_RECOVERY_LAST_CODE_USED écrit quand le dernier code déclenche un reset en mode TEMPORARY", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .send("recoveryAction=TEMPORARY")
      .set("Cookie", `${sess.name}=${cookie}`);

    await flushAuditLog();

    const log = await prisma.mfaAuditLog.findFirst({
      where: { userId: user.id, eventType: "MFA_RECOVERY_LAST_CODE_USED" }
    });
    expect(log).not.toBeNull();
    expect(log!.success).toBe(true);
  });

  it("logs MFA recovery : aucun code TOTP, code de récupération ou mot de passe stocké", async () => {
    const { user, plainCode } = await createUserWithRecoveryCode();
    const cookie = await doLogin(user.email);

    await request
      .post("/recovery-login")
      .send(`recoveryCode=${plainCode}`)
      .set("Cookie", `${sess.name}=${cookie}`);

    await flushAuditLog();

    const logs = await prisma.mfaAuditLog.findMany({
      where: { userId: user.id }
    });
    // Le modèle MfaAuditLog n'a pas de champ libre — seul eventType est une string
    // et ne doit pas contenir de valeur sensible
    const sensitivePatterns = ["ABCDE", "FGHIJ", "pass", "TOTP"];
    logs.forEach(l => {
      sensitivePatterns.forEach(p => {
        expect(l.eventType).not.toContain(p);
      });
    });
  });
});
