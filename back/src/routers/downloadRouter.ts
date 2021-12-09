import { Request, Response } from "express";
import { bsdaPdfDownloadHandler } from "../bsda/resolvers/queries/bsdaPdf";
import { bsdasriPdfDownloadHandler } from "../bsdasris/resolvers/queries/bsdasriPdf";
import { bsffPdfDownloadHandler } from "../bsffs/resolvers/queries/bsffPdf";
import { bsvhuPdfDownloadHandler } from "../bsvhu/resolvers/queries/bsvhuPdf";
import { redisClient } from "../common/redis";
import { formPdfDownloadHandler } from "../forms/resolvers/queries/formPdf";
import { wastesCsvDownloadHandler } from "../register/resolvers/queries/wastesCsv";
import { wastesXlsDownloadHandler } from "../register/resolvers/queries/wastesXls";
import {
  Query,
  QueryBsdaPdfArgs,
  QueryBsdasriPdfArgs,
  QueryBsffPdfArgs,
  QueryBsvhuPdfArgs,
  QueryFormPdfArgs,
  QueryFormsRegisterArgs,
  QueryWastesCsvArgs,
  QueryWastesXlsArgs
} from "../generated/graphql/types";

// List all GraphQL resolvers that register a download handler
// These values are used as serialization key in Redis
type DownloadHandlerName = keyof Pick<
  Query,
  | "formPdf"
  | "bsdaPdf"
  | "bsdasriPdf"
  | "bsffPdf"
  | "bsvhuPdf"
  | "wastesCsv"
  | "wastesXls"
>;

// List all different params that can be passed to a download handler
type DownloadHandlerParams =
  | QueryFormPdfArgs
  | QueryBsdaPdfArgs
  | QueryBsdasriPdfArgs
  | QueryBsffPdfArgs
  | QueryBsvhuPdfArgs
  | QueryFormsRegisterArgs
  | QueryWastesCsvArgs
  | QueryWastesXlsArgs;

type DownloadHandlerFn<P extends DownloadHandlerParams> = (
  req: Request,
  res: Response,
  params: P
) => void | Promise<void>;

export type DownloadHandler<P extends DownloadHandlerParams> = {
  name: DownloadHandlerName;
  handler: DownloadHandlerFn<P>;
};

type DownloadHandlers = {
  [key in DownloadHandlerName]: DownloadHandlerFn<DownloadHandlerParams>;
};

// Payload stored in Redis used to serialize
// a downloadable file
export type FileDownloadPayload = {
  handler: DownloadHandlerName;
  params: DownloadHandlerParams;
};

const downloadHandlers: DownloadHandlers = [
  formPdfDownloadHandler,
  bsdaPdfDownloadHandler,
  bsdasriPdfDownloadHandler,
  bsffPdfDownloadHandler,
  bsvhuPdfDownloadHandler,
  wastesCsvDownloadHandler,
  wastesXlsDownloadHandler
].reduce((acc, { name, handler }) => {
  return { ...acc, [name]: handler };
}, {} as DownloadHandlers);

/**
 * Handler for the /download route
 */
export async function downloadRouter(req: Request, res: Response) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("La chaîne de requête `token` est manquante.");
  }

  if (typeof token !== "string") {
    return res.status(400).send("Le token doit être une chaine de caractères.");
  }

  const redisValue = await redisClient.get(token);

  if (redisValue == null) {
    return res.status(403).send("Token invalide ou expiré.");
  }

  const { handler, params }: FileDownloadPayload = JSON.parse(redisValue);

  const handlerFn = downloadHandlers[handler];

  if (!handlerFn) {
    // This should not be permitted by the type system
    // but handle the case anyway with an internal error
    throw new Error(`Unregistered download handler ${handler}`);
  }

  return handlerFn(req, res, params);
}
