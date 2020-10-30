import * as yup from "yup";
import { getFileDownloadToken } from "../../../common/file-download";
import { downloadFormsRegister } from "../../exports/handler";
import { QueryResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { formsWhereInput } from "../../exports/where-inputs";
import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import validDatetime from "../../../common/yup/validDatetime";
import { checkIsCompanyMember } from "../../../users/permissions";

const TYPE = "forms_register";

const validationSchema = yup.object().shape({
  startDate: validDatetime({
    verboseFieldName: "Date de début",
    required: false
  }),
  endDate: validDatetime({
    verboseFieldName: "Date de début",
    required: false
  })
});

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
    args.startDate,
    args.endDate,
    args.wasteCode
  );

  // check if register is empty
  const isEmpty = !(await prisma.$exists.form(whereInput));

  if (isEmpty) {
    throw new UserInputError(
      "Aucune donnée à exporter sur la période sélectionnée"
    );
  }

  return getFileDownloadToken(
    { type: TYPE, params: args },
    downloadFormsRegister
  );
};

export default formsRegisterResolver;
