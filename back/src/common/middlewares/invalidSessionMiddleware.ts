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

  // Only check if:
  // - there is a req.user. Otherwise, it's not an authenticated request, let the resolvers throw
  // - the session has an issuedAt date (set at login). Otherwise, it's probably a bearer token request
  if (
    userPasswordChangedAt &&
    sessionIssuedAt &&
    sessionIssuedAt <= userPasswordChangedAt
  ) {
    req.logout(err => {
      if (err) {
        return next(err);
      }

      res.redirect(`${UI_BASE_URL}/login`);
    });
    return;
  }

  return next();
}
