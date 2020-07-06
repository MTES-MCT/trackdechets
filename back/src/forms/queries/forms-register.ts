import { getFileDownloadToken } from "../../common/file-download";
import { downloadFormsRegister } from "../exports/handler";
import {
  QueryFormsRegisterArgs,
  FileDownload
} from "../../generated/graphql/types";
import { prisma } from "../../generated/prisma-client";
import { formsWhereInput } from "../exports/where-inputs";
import { UserInputError } from "apollo-server-express";

const TYPE = "forms_register";

export async function formsRegister(
  params: QueryFormsRegisterArgs
): Promise<FileDownload> {
  const whereInput = formsWhereInput(
    params.exportType,
    params.sirets,
    params.startDate,
    params.endDate,
    params.wasteCode
  );

  // check if register is empty
  const isEmpty = !(await prisma.$exists.form(whereInput));

  if (isEmpty) {
    throw new UserInputError(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  }

  return getFileDownloadToken({ type: TYPE, params }, downloadFormsRegister);
}
