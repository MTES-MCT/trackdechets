import { MutationResolvers } from "../../generated/graphql/types";
import createForm from "./mutations/createForm";
import updateForm from "./mutations/updateForm";
import saveForm from "./mutations/saveForm";
import deleteForm from "./mutations/deleteForm";

const Mutation: MutationResolvers = {
  createForm,
  updateForm,
  saveForm,
  deleteForm
};

export default Mutation;
