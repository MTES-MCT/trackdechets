import supertest from "supertest";
import { hash } from "bcrypt";
import { resetDatabase } from "../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { app, sess } from "../server";
import { userFactory } from "./factories";
import { addSeconds } from "date-fns";

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
  afterEach(() => resetDatabase());

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
    // lockout must be ~5 minutes from now
    expect(
      updatedUser.recoveryLockedUntil!.getTime() - before.getTime() >= 300_000
    ).toBe(true);
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

  it("rejects a code that has already been deleted (already used)", async () => {
    const { user } = await createUserWithRecoveryCode("ABCDE-FGHIJ");
    const cookie = await doLogin(user.email);

    // First use — valid
    await request
      .post("/recovery-login")
      .send("recoveryCode=ABCDE-FGHIJ")
      .set("Cookie", `${sess.name}=${cookie}`);

    // Re-login to get a new preloggedUser session
    const cookie2 = await doLogin(user.email);

    // Second use of the same code — must fail (codes were deleted)
    const res = await request
      .post("/recovery-login")
      .send("recoveryCode=ABCDE-FGHIJ")
      .set("Cookie", `${sess.name}=${cookie2}`);

    expect(res.status).toBe(302);
    expect(res.header.location).toContain("errorCode=INVALID_RECOVERY_CODE");
  });
});
