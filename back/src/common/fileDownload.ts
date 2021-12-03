import { setInCache, SetOptions } from "./redis";
import {
  DownloadHandlerType,
  DownloadHandlerParams
} from "../routers/downloadRouter";
import { randomNumber, getAPIBaseURL } from "../utils";
import { FileDownload } from "../generated/graphql/types";

type FileDownloadParams = {
  handler: DownloadHandlerType;
  params: DownloadHandlerParams;
};

/**
 * GraphQL FileDownload resolver
 *
 * Creates a temporary token stored in Redis used to download
 * a file from the /download route.
 * When it is passed to the /download toute, the token is
 * deserialized and params are passed to the relevant handler
 */
export async function getFileDownload({
  handler,
  params
}: FileDownloadParams): Promise<FileDownload> {
  const token = `${handler}-${new Date().getTime()}-${randomNumber(4)}`;

  const options: SetOptions = {};

  if (process.env.NODE_ENV === "production") {
    options.EX = 10;
  }

  await setInCache(token, JSON.stringify({ handler, params }), options);

  const API_BASE_URL = getAPIBaseURL();
  return {
    token,
    downloadLink: `${API_BASE_URL}/download?token=${token}`
  };
}
