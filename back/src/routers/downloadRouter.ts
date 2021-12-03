import { Request, Response } from "express";
import { bsdaPdfDownloadHandler } from "../bsda/resolvers/queries/bsdaPdf";
import { bsdasriPdfDownloadHandler } from "../bsdasris/resolvers/queries/bsdasriPdf";
import { bsffPdfDownloadHandler } from "../bsffs/resolvers/queries/bsffPdf";
import { bsvhuPdfDownloadHandler } from "../bsvhu/resolvers/queries/bsvhuPdf";
import { redisClient } from "../common/redis";
import { formPdfDownloadHandler } from "../forms/resolvers/queries/formPdf";
import { formsRegisterDownloadHandler } from "../forms/resolvers/queries/formsRegister";

type DownloadHandlerFn<P> = (
  req: Request,
  res: Response,
  params: P
) => void | Promise<void>;

export type DownloadHandler<P> = {
  // name used deserialize handler from Redis key
  name: string;
  handler: DownloadHandlerFn<P>;
};

const downloadHandlers = [
  formPdfDownloadHandler,
  bsdaPdfDownloadHandler,
  bsdasriPdfDownloadHandler,
  bsffPdfDownloadHandler,
  bsvhuPdfDownloadHandler,
  formsRegisterDownloadHandler
].reduce((acc, { name, handler }) => {
  return { ...acc, [name]: handler };
}, {});

/**
 * Handler for the /download route
 */
export async function downloadRouter(req: Request, res: Response) {
  const { token } = req.query;

  if (typeof token !== "string") {
    return res.status(400).send("Le token doit être une chaine de caractères.");
  }

  const redisValue = await redisClient.get(token).catch(() => null);

  if (redisValue == null) {
    return res.status(403).send("Token invalide ou expiré.");
  }

  const {
    name,
    params
  }: {
    name: string;
    params: any;
  } = JSON.parse(redisValue);

  const handler = downloadHandlers[name];
  if (!handler) {
    return res.status(500).send("Type de fichier inconnu.");
  }

  return handler(req, res, params);
}
