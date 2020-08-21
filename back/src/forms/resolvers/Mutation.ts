import { MutationResolvers } from "../../generated/graphql/types";
import createForm from "./mutations/createForm";
import updateForm from "./mutations/updateForm";
import saveForm from "./mutations/saveForm";
import deleteForm from "./mutations/deleteForm";
import duplicateForm from "./mutations/duplicateForm";
import markAsSealed from "./mutations/markAsSealed";
import markAsSent from "./mutations/markAsSent";

const Mutation: MutationResolvers = {
  createForm,
  updateForm,
  saveForm,
  deleteForm,
  duplicateForm,
  markAsSealed,
  markAsSent
};

export default Mutation;
