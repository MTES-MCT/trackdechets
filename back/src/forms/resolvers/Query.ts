import { QueryResolvers } from "../../generated/graphql/types";
import form from "./queries/form";
import forms from "./queries/forms";
import formPdf from "./queries/formPdf";
import formsLifeCycle from "./queries/formsLifeCycle";
import formsRegister from "./queries/formsRegister";
import stats from "./queries/stats";

const Query: QueryResolvers = {
  form,
  forms,
  formPdf
  // formsLifeCycle,
  // formsRegister,
  // stats
};

export default Query;
