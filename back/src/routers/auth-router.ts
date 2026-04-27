import { Router } from "express";
import passport from "passport";
import querystring from "querystring";
import { prisma } from "@td/prisma";
import { z } from "zod";
import { compare } from "bcrypt";
import { addSeconds } from "date-fns";
import nocache from "../common/middlewares/nocache";
import { rateLimiterMiddleware } from "../common/middlewares/rateLimiter";
import { getUIBaseURL, sanitizeEmail } from "../utils";
import { getSafeReturnTo } from "../common/helpers";
import { AuthType } from "../auth/auth";
import { sendMail } from "../mailer/mailing";
import { onTotpRecoveryUsed, renderMail } from "@td/mail";

const RECOVERY_MAX_FAILS = 3;
const RECOVERY_LOCK_SECONDS = 3600;

const UI_BASE_URL = getUIBaseURL();

const windowMs = 1000 * 60;
const maxRequestsPerWindow = process.env.NODE_ENV === "test" ? 1000 : 10;

export const authRouter = Router();
authRouter.post(
  "/login",
  rateLimiterMiddleware({
    windowMs,
    maxRequestsPerWindow,
    keyGenerator: (ip, request) => {
      const { email } = request.body;
      return `login_${ip}_${email ? sanitizeEmail(email) : "void"}`;
    }
  }),
  (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        // retrieve session info to redirect to 2nd factor if needed
        const userEmail = req.session?.preloggedUser?.userEmail;
        const expire = req.session?.preloggedUser?.expire;

        if (userEmail && expire && new Date(expire) > new Date()) {
          return res.redirect(`${UI_BASE_URL}/second-factor`);
        }

        const queries = {
          ...{
            errorCode: info?.code ?? "",
            username: info?.username ?? ""
          },
          ...(req.body.returnTo
            ? { returnTo: getSafeReturnTo(req.body.returnTo, UI_BASE_URL) }
            : {})
        };
        return res.redirect(
          `${UI_BASE_URL}/login?${querystring.stringify(queries)}`
        );
      }
      req.logIn(user, () => {
        req.session.issuedAt = new Date().toISOString();
        const returnTo = getSafeReturnTo(req.body.returnTo, UI_BASE_URL);
        return res.redirect(`${UI_BASE_URL}${returnTo}`);
      });
    })(req, res, next);
  }
);

authRouter.post("/otp", (req, res, next) => {
  passport.authenticate("totp", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      const queries = {
        ...{
          errorCode: info.code,
          ...(info?.lockout ? { lockout: info.lockout } : {})
        },
        ...(req.body.returnTo
          ? { returnTo: getSafeReturnTo(req.body.returnTo, UI_BASE_URL) }
          : {})
      };

      if (info.code === "TOTP_TIMEOUT_OR_MISSING_SESSION") {
        return res.redirect(
          `${UI_BASE_URL}/login?${querystring.stringify(queries)}`
        );
      }
      return res.redirect(
        `${UI_BASE_URL}/second-factor?${querystring.stringify(queries)}`
      );
    }
    req.logIn(user, () => {
      req.session.issuedAt = new Date().toISOString();
      const returnTo = getSafeReturnTo(req.body.returnTo, UI_BASE_URL);
      return res.redirect(`${UI_BASE_URL}${returnTo}`);
    });
  })(req, res, next);
});

authRouter.post("/recovery", async (req, res) => {
  const isAjax = req.headers["x-requested-with"] === "fetch";
  const userEmail = req.session?.preloggedUser?.userEmail;
  const expire = req.session?.preloggedUser?.expire;

  if (!expire || !userEmail || new Date(expire) < new Date()) {
    return res.redirect(
      `${UI_BASE_URL}/login?${querystring.stringify({
        errorCode: "TOTP_TIMEOUT_OR_MISSING_SESSION"
      })}`
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: sanitizeEmail(userEmail) },
    include: { totpRecoveryCodes: { where: { usedAt: null } } }
  });

  if (!user) {
    return res.redirect(
      `${UI_BASE_URL}/second-factor?${querystring.stringify({
        errorCode: "TOTP_TIMEOUT_OR_MISSING_SESSION"
      })}`
    );
  }

  if (user.recoveryLockedUntil && user.recoveryLockedUntil > new Date()) {
    return res.redirect(
      `${UI_BASE_URL}/second-factor?${querystring.stringify({
        errorCode: "RECOVERY_LOCKOUT"
      })}`
    );
  }

  const rawCode = String(req.body.recoveryCode ?? "");
  const normalizedCode = rawCode.replace(/-/g, "").toUpperCase();

  let matchedCodeId: string | null = null;
  for (const code of user.totpRecoveryCodes) {
    if (await compare(normalizedCode, code.codeHash)) {
      matchedCodeId = code.id;
      break;
    }
  }

  if (!matchedCodeId) {
    const newFails = user.recoveryFails + 1;
    const locked = newFails >= RECOVERY_MAX_FAILS;

    if (locked) {
      const now = new Date();
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            recoveryFails: newFails,
            recoveryLockedUntil: addSeconds(now, RECOVERY_LOCK_SECONDS),
            totpSeed: null,
            totpActivatedAt: null,
            totpSetupRequired: true
          }
        }),
        prisma.totpRecoveryCode.updateMany({
          where: { userId: user.id },
          data: { usedAt: now }
        })
      ]);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { recoveryFails: newFails }
      });
    }

    const errorCode = locked ? "RECOVERY_LOCKOUT" : "INVALID_RECOVERY_CODE";

    if (isAjax) {
      return res.status(401).json({ errorCode });
    }

    const queries = {
      errorCode,
      ...(req.body.returnTo
        ? { returnTo: getSafeReturnTo(req.body.returnTo, UI_BASE_URL) }
        : {})
    };
    return res.redirect(
      `${UI_BASE_URL}/second-factor?${querystring.stringify(queries)}`
    );
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        totpSeed: null,
        totpActivatedAt: null,
        totpSetupRequired: true,
        recoveryFails: 0,
        recoveryLockedUntil: null,
        passwordUpdatedAt: now
      }
    }),
    prisma.totpRecoveryCode.updateMany({
      where: { userId: user.id },
      data: { usedAt: now }
    })
  ]);

  await sendMail(
    renderMail(onTotpRecoveryUsed, {
      to: [{ name: user.name, email: user.email }]
    })
  );

  req.logIn({ ...user, auth: AuthType.Session } as Express.User, () => {
    req.session.issuedAt = new Date().toISOString();
    delete req.session.preloggedUser;
    const returnTo = getSafeReturnTo(req.body.returnTo, UI_BASE_URL);
    if (isAjax) {
      return res.json({ success: true, redirectTo: `${UI_BASE_URL}${returnTo}` });
    }
    return res.redirect(`${UI_BASE_URL}${returnTo}`);
  });
});

authRouter.get("/isAuthenticated", nocache, (req, res) => {
  return res.json({ isAuthenticated: req.isAuthenticated() });
});

authRouter.post("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }

    res.redirect(UI_BASE_URL);
  });
});

authRouter.post<{ email: string }>("/impersonate", async (req, res) => {
  if (!req.user?.isAdmin) {
    return res.status(404).send();
  }

  const parsedBody = z
    .object({
      email: z.string().trim().email().toLowerCase().trim()
    })
    .parse(req.body);

  const impersonatedUser = await prisma.user.findUnique({
    where: { email: parsedBody.email },
    select: { id: true }
  });

  if (!impersonatedUser) {
    return res.status(400).send("Unknown email");
  }

  req.session.impersonatedUserId = impersonatedUser.id;
  req.session.impersonationStartsAt = Date.now();
  req.session.warningMessage = `Attention, vous êtes actuellement connecté avec le compte utilisateur ${parsedBody.email} pour une durée de 1 heure.`;

  return res.redirect(UI_BASE_URL);
});

authRouter.delete("/impersonate", (req, res) => {
  delete req.session.impersonatedUserId;
  delete req.session.impersonationStartsAt;
  delete req.session.warningMessage;
  return res.status(200).send();
});
