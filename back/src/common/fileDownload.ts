import { setInCache, SetOptions } from "./redis";
import { FileDownloadPayload } from "../routers/downloadRouter";
import { getAPIBaseURL, getUid } from "../utils";
import { FileDownload } from "@td/codegen-back";

/**
 * GraphQL FileDownload resolver
 *
 * Creates a temporary token stored in Redis used to download
 * a file from the /download route.
 * When it is passed to the /download route, the token is
 * deserialized and params are passed to the relevant handler
 */
export async function getFileDownload({
  handler,
  params
}: FileDownloadPayload): Promise<FileDownload> {
  const token = getUid(10);
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
