import { MutationResolvers } from "../../generated/graphql/types";
import createForm from "./mutations/createForm";
import updateForm from "./mutations/updateForm";
import saveForm from "./mutations/saveForm";
import deleteForm from "./mutations/deleteForm";
import duplicateForm from "./mutations/duplicateForm";

const Mutation: MutationResolvers = {
  createForm,
  updateForm,
  saveForm,
  deleteForm,
  duplicateForm
};

export default Mutation;
