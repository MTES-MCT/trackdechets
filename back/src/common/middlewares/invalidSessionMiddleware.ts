import { getUIBaseURL } from "../../utils";
import { Request, Response, NextFunction } from "express";

export async function invalidSessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const UI_BASE_URL = getUIBaseURL();

  const sessionIssuedAt = req.session.issuedAt;
  const userPasswordChangedAt = req.user?.passwordUpdatedAt?.toISOString();

  if (
    !userPasswordChangedAt ||
    !sessionIssuedAt ||
    sessionIssuedAt <= userPasswordChangedAt
  ) {
    req.logout(err => {
      if (err) {
        return next(err);
      }

      res.redirect(UI_BASE_URL);
    });
    return;
  }

  return next();
}
