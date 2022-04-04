import { Request, Response, NextFunction } from "express";

/**
 * Express middleware to prevent response
 * from being cached by the browser
 */
export default (_req: Request, res: Response, next: NextFunction) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
};
