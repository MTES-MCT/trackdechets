import { QueryResolvers } from "../../../generated/graphql/types";

export type MyCompaniesXlsArgs = { userId: string };

const myCompaniesXlsResolver: QueryResolvers["myCompaniesXls"] = async (
  _parent,
  args,
  context
) => {
  return { downloadLink: "" };
};

export default myCompaniesXlsResolver;
