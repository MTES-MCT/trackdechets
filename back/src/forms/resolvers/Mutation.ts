import { MutationResolvers } from "../../generated/graphql/types";
import createForm from "./mutations/createForm";
import updateForm from "./mutations/updateForm";
import saveForm from "./mutations/saveForm";
import deleteForm from "./mutations/deleteForm";
import duplicateForm from "./mutations/duplicateForm";
import markAsSealed from "./mutations/markAsSealed";

const Mutation: MutationResolvers = {
  createForm,
  updateForm,
  saveForm,
  deleteForm,
  duplicateForm,
  markAsSealed
};

export default Mutation;
