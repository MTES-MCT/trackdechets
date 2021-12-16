import { QueryResolvers } from "../../../generated/graphql/types";

const myCompaniesResolver: QueryResolvers["myCompanies"] = async (
  parent,
  args,
  context
) => {
  //const me = checkIsAuthenticated(context);

  return {
    totalCount: 0,
    edges: [],
    pageInfo: {
      startCursor: "",
      endCursor: "",
      hasNextPage: false,
      hasPreviousPage: false
    }
  };
};

export default myCompaniesResolver;
