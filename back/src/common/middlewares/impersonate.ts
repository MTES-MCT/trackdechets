import { prisma } from "@td/prisma";
import { Request, Response, NextFunction } from "express";

export async function impersonateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (
    req.session.impersonatedUserId &&
    req.session.impersonationStartsAt &&
    req.user?.isAdmin
  ) {
    const maxDuration = 60 * 60 * 1000; // 1 hour
    if (Date.now() - req.session.impersonationStartsAt > maxDuration) {
      delete req.session.impersonatedUserId;
      delete req.session.impersonationStartsAt;
      delete req.session.warningMessage;
      return next();
    }

    const impersonatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: req.session.impersonatedUserId }
    });

    req.user = { ...impersonatedUser, auth: req.user.auth };
  }

  return next();
}
