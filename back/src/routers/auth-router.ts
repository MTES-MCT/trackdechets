import { Router } from "express";
import passport from "passport";
import querystring from "querystring";
import { getUIBaseURL } from "../utils";
import { sess } from "../server";
import nocache from "../common/middlewares/nocache";
import { impersonationMiddleware } from "../common/middlewares/impersonation";

const UI_BASE_URL = getUIBaseURL();

export const authRouter = Router();
authRouter.post("/login", impersonationMiddleware, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      const queries = {
        ...{
          error: info.message,
          errorField: info.errorField,
          username: info.username
        },
        ...(req.body.returnTo ? { returnTo: req.body.returnTo } : {})
      };

      return res.redirect(
        `${UI_BASE_URL}/login?${querystring.stringify(queries)}`
      );
    }
    req.login(user, () => {
      const returnTo = req.body.returnTo || "/";
      return res.redirect(`${UI_BASE_URL}${returnTo}`);
    });
  })(req, res, next);
});

authRouter.get("/isAuthenticated", nocache, (req, res) => {
  return res.json({ isAuthenticated: req.isAuthenticated() });
});

authRouter.post("/logout", (req, res) => {
  req.logout();
  res
    .clearCookie(sess.name, {
      domain: sess.cookie.domain,
      path: "/"
    })
    .redirect(`${UI_BASE_URL}`);
});
