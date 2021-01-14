import { UserInputError } from "apollo-server-express";
import prisma from "src/prisma";
import * as yup from "yup";
import { getFileDownloadToken } from "../../../common/file-download";
import { checkIsAuthenticated } from "../../../common/permissions";
import validDatetime from "../../../common/yup/validDatetime";
import { checkIsCompanyMember } from "../../../users/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { downloadFormsRegister } from "../../exports/handler";
import { formsWhereInput } from "../../exports/where-inputs";

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

  return getFileDownloadToken(
    { type: TYPE, params: args },
    downloadFormsRegister
  );
};

export default formsRegisterResolver;
