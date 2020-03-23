import * as express from "express";
import * as passport from "passport";
import * as querystring from "querystring";
import { getUIBaseURL } from "../utils";
import { sess } from "../server";
import nocache from "../common/middlewares/nocache";

const { UI_HOST, SESSION_COOKIE_HOST } = process.env;

const UI_BASE_URL = getUIBaseURL();

const authRouter = express.Router();
authRouter.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      const queries = {
        ...{ error: info.message },
        ...(req.body.returnTo ? { returnTo: req.body.returnTo } : {})
      };
      return res.redirect(
        `${UI_BASE_URL}/login?${querystring.stringify(queries)}`
      );
    }
    req.login(user, () => {
      const returnTo = req.body.returnTo || "/dashboard/slips";
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
      domain: SESSION_COOKIE_HOST || UI_HOST,
      path: "/"
    })
    .redirect(`${UI_BASE_URL}`);
});

export { authRouter };
