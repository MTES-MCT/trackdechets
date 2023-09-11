import { Request, Response } from "express";
import {
  QueryFormPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkCanRead } from "../../permissions";
import { generateBsddPdf } from "../../pdf";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { createPDFResponse } from "../../../common/pdf";

export const formPdfDownloadHandler: DownloadHandler<QueryFormPdfArgs> = {
  name: "formPdf",
  handler: async (req: Request, res: Response, { id }: { id: string }) => {
    const form = await getFormOrFormNotFound({ id });
    const readableStream = await generateBsddPdf(form);

    readableStream.pipe(createPDFResponse(res, form.readableId));
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

  await checkCanRead(user, form);

  return getFileDownload({
    handler: formPdfDownloadHandler.name,
    params: { id }
  });
};

export default formPdfResolver;
