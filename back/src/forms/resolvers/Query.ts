import { QueryResolvers } from "../../generated/graphql/types";
import form from "./queries/form";
import forms from "./queries/forms";
import formPdf from "./queries/formPdf";
import appendixForms from "./queries/appendixForms";
import formsLifeCycle from "./queries/formsLifeCycle";
import formsRegister from "./queries/formsRegister";
import stats from "./queries/stats";
import formRevisionRequests from "./queries/formRevisionRequests";

export type FormQueryResolvers = Pick<
  QueryResolvers,
  | "form"
  | "forms"
  | "formPdf"
  | "appendixForms"
  | "formsLifeCycle"
  | "formsRegister"
  | "stats"
  | "formRevisionRequests"
>;

const Query: FormQueryResolvers = {
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
