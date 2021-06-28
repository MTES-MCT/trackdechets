import { Request, Response } from "express";
import { redisClient, setInCache } from "./redis";
import { randomNumber, getAPIBaseURL } from "../utils";

type DownloadInfos = { type: string; params: any };
type DownloadHandler = (
  req: Request,
  res: Response,
  params: any
) => void | Promise<void>;

// TODO register downloaders on server start if code is distributed on several machines
const fileDownloaders = {};
export function registerFileDownloader(
  type: string,
  downloadHandler: DownloadHandler
) {
  if (type in fileDownloaders && fileDownloaders[type] !== downloadHandler) {
    throw new Error(
      `Type "${type}" is already registered as downloadable with an handler.`
    );
  }
  fileDownloaders[type] = downloadHandler;
}

/**
 * Basically the resolver implementation for Graphql downloadable types.
 * It creates a token valid for 10 seconds and returns it.
 * This token can then be used to download the desired file
 * @param downloadInfos object `type` (must be unique) and some `params` passed to the handler
 * @param downloadHandler the handler. Must output the file through the response object it receives
 */
export async function getFileDownloadToken(
  { type, params }: DownloadInfos,
  downloadHandler: DownloadHandler
) {
  const token = `${type}-${new Date().getTime()}-${randomNumber(4)}`;

  await setInCache(token, JSON.stringify({ type, params }), { EX: 10 });
  registerFileDownloader(type, downloadHandler);

  const API_BASE_URL = getAPIBaseURL();
  return {
    token,
    downloadLink: `${API_BASE_URL}/download?token=${token}`
  };
}

/**
 * Handler for the /download route
 * @param req
 * @param res
 */
export async function downloadFileHandler(req: Request, res: Response) {
  const { token } = req.query;

  if (typeof token !== "string") {
    return res.status(400).send("Le token doit être une chaine de caractères.");
  }

  const redisValue = await redisClient.get(token).catch(() => null);

  if (redisValue == null) {
    return res.status(403).send("Token invalide ou expiré.");
  }

  const { type, params }: DownloadInfos = JSON.parse(redisValue);

  const fileDownloader = fileDownloaders[type];
  if (!fileDownloader) {
    return res.status(500).send("Type de fichier inconnu.");
  }

  return fileDownloader(req, res, params);
}
