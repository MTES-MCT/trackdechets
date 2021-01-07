import { QueryResolvers } from "../../../generated/graphql/types";
import { searchForms } from "../../../elastic";

const searchFormsResolver: QueryResolvers["searchForms"] = async () => {
  return searchForms();
};

export default searchFormsResolver;
