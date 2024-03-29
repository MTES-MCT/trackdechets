import * as yup from "yup";
import { QueryResolvers } from "../../../generated/graphql/types";
import { getPublicCompanyInfos } from "./companyInfos";
import { isOrgId } from "../../../../../libs/shared/constants/src";
import { checkIsAuthenticated } from "../../../common/permissions";

const toSet = (_, value) => [...new Set(value?.filter(Boolean))];
export const companiesInfosSchema = yup.object({
  orgIds: yup
    .array()
    .of(
      yup
        .string()
        .test("is-valid-orgId", "'${value}' n'est pas un orgId valide", isOrgId)
    )
    .ensure()
    .compact()
    .required()
    .min(1)
    .max(100)
    .transform(toSet)
});

const companiesInfosResolvers: QueryResolvers["companiesInfos"] = async (
  _,
  args,
  context
) => {
  checkIsAuthenticated(context);

  const { orgIds } = await companiesInfosSchema.validate(args);

  const companiesInfos = await Promise.all(
    orgIds.map(async orgId => {
      if (!orgId) return;
      return await getPublicCompanyInfos(orgId);
    })
  );

  return companiesInfos.filter(Boolean);
};

export default companiesInfosResolvers;
