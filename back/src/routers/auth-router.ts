import * as express from "express";
import * as passport from "passport";
import { getUIBaseURL } from "../utils";

const { UI_HOST } = process.env;

const UI_BASE_URL = getUIBaseURL();

const authRouter = express.Router();

authRouter.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(`${UI_BASE_URL}/login?error=${info.message}`);
    }
    req.login(user, () => {
      return res.redirect(`${UI_BASE_URL}/dashboard/slips`);
    });
  })(req, res, next);
});

authRouter.get("/isAuthenticated", (req, res) => {
  return res.json({ isAuthenticated: req.isAuthenticated() });
});

authRouter.post("/logout", (req, res) => {
  req.logout();
  res
    .clearCookie("connect.sid", { domain: UI_HOST, path: "/" })
    .redirect(`${UI_BASE_URL}`);
});

export { authRouter };
