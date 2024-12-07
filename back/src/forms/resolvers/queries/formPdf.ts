import { Request, Response } from "express";
import type { QueryFormPdfArgs, QueryResolvers } from "@td/codegen-back";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { hasGovernmentReadAllBsdsPermOrThrow } from "../../../permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkCanRead } from "../../permissions";
import { generateBsddPdf } from "../../pdf";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { createPDFResponse } from "../../../common/pdf";

export const formPdfDownloadHandler: DownloadHandler<QueryFormPdfArgs> = {
  name: "formPdf",
  handler: async (req: Request, res: Response, { id }: { id: string }) => {
    const { filename, stream: readableStream } = await generateBsddPdf(id);

    readableStream.pipe(createPDFResponse(res, filename));
  }
};

const formPdfResolver: QueryResolvers["formPdf"] = async (
  parent,
  { id },
  context
) => {
  // check query level permission
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound(
    { id },
    {
      forwardedIn: { include: { transporters: true } },
      transporters: true,
      intermediaries: true,
      grouping: { include: { initialForm: true } }
    }
  );

  // The admin dashboard shows BSD cards & must allow PDF downloads
  if (!user.isAdmin && !user.governmentAccountId) {
    await checkCanRead(user, form);
  }

  if (user.governmentAccountId) {
    await hasGovernmentReadAllBsdsPermOrThrow(user);
  }
  return getFileDownload({
    handler: formPdfDownloadHandler.name,
    params: { id }
  });
};

export default formPdfResolver;
