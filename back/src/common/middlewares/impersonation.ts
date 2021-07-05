import { Request, Response, NextFunction } from "express";
import prisma from "../../prisma";
import { getUIBaseURL, sanitizeEmail } from "../../utils";

const UI_BASE_URL = getUIBaseURL();

export async function impersonationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.isAdmin) return next();
  const user = await prisma.user.findUnique({
    where: { email: sanitizeEmail(req.body.email) }
  });

  req.login(user, err => {
    if (err) {
      return next(err);
    }

    const returnTo = req.body.returnTo || "/";
    return res.redirect(`${UI_BASE_URL}${returnTo}`);
  });
}
