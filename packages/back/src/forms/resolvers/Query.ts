import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
import form from "./queries/form";
import forms from "./queries/forms";
import formPdf from "./queries/formPdf";
import appendixForms from "./queries/appendixForms";
import formsLifeCycle from "./queries/formsLifeCycle";
import formsRegister from "./queries/formsRegister";
import stats from "./queries/stats";
import formRevisionRequests from "./queries/formRevisionRequests";

const Query: QueryResolvers = {
  form,
  forms,
  formPdf,
  appendixForms,
  formsLifeCycle,
  formsRegister,
  stats,
  formRevisionRequests: formRevisionRequests as any
};

export default Query;
