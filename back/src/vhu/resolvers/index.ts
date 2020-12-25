import {
  MutationResolvers,
  QueryResolvers
} from "../../generated/graphql/types";

import vhuForm from "./queries/form";
import createVhuForm from "./mutations/create";
import editVhuForm from "./mutations/edit";
import signVhuForm from "./mutations/sign";

const Query: QueryResolvers = {
  vhuForm
  //vhuForms
};

const Mutation: MutationResolvers = {
  createVhuForm,
  editVhuForm,
  signVhuForm
};

export default { Query, Mutation };
