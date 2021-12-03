import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import * as yup from "yup";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyMember } from "../../../users/permissions";
import {
  QueryFormsRegisterArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { downloadFormsRegister } from "../../exports/handler";
import { formsWhereInput } from "../../exports/where-inputs";
import { DownloadHandler } from "../../../routers/downloadRouter";

const validationSchema = yup.object().shape({
  startDate: yup.date().nullable(),
  endDate: yup.date().nullable()
});

export const formsRegisterDownloadHandler: DownloadHandler<QueryFormsRegisterArgs> =
  {
    name: "formsRegister",
    handler: downloadFormsRegister
  };

const formsRegisterResolver: QueryResolvers["formsRegister"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  validationSchema.validateSync(args);

  for (const siret of args.sirets) {
    // check user is member of every provided sirets
    await checkIsCompanyMember({ id: user.id }, { siret: siret });
  }

  const whereInput = formsWhereInput(
    args.exportType,
    args.sirets,
    args.startDate ? new Date(args.startDate) : null,
    args.endDate ? new Date(args.endDate) : null,
    args.wasteCode
  );

  // check if register is empty
  const isEmpty = !(await prisma.form.findFirst({ where: whereInput }));

  if (isEmpty) {
    throw new UserInputError(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  }

  return getFileDownload({
    handler: formsRegisterDownloadHandler.name,
    params: args
  });
};

export default formsRegisterResolver;
