import { Router } from "express";
import passport from "passport";
import querystring from "querystring";
import { prisma } from "@td/prisma";
import { z } from "zod";
import nocache from "../common/middlewares/nocache";
import { rateLimiterMiddleware } from "../common/middlewares/rateLimiter";
import { storeUserSessionsId } from "../common/redis/users";
import { getUIBaseURL, sanitizeEmail } from "../utils";
import { getSafeReturnTo } from "../common/helpers";

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
        storeUserSessionsId(user.id, req.session.id);
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
          errorCode: info.code
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
      storeUserSessionsId(user.id, req.session.id);
      const returnTo = getSafeReturnTo(req.body.returnTo, UI_BASE_URL);
      return res.redirect(`${UI_BASE_URL}${returnTo}`);
    });
  })(req, res, next);
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
