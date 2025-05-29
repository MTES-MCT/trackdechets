import type { QueryResolvers } from "@td/codegen-back";
import form from "./queries/form";
import forms from "./queries/forms";
import formPdf from "./queries/formPdf";
import appendixForms from "./queries/appendixForms";
import formsLifeCycle from "./queries/formsLifeCycle";
import formRevisionRequests from "./queries/formRevisionRequests";

export type FormQueryResolvers = Pick<
  QueryResolvers,
  | "form"
  | "forms"
  | "formPdf"
  | "appendixForms"
  | "formsLifeCycle"
  | "formRevisionRequests"
>;

const Query: FormQueryResolvers = {
  form,
  forms,
  formPdf,
  appendixForms,
  formsLifeCycle,
  formRevisionRequests: formRevisionRequests as any
};

export default Query;
