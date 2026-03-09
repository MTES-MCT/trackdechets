import type { QueryResolvers } from "@td/codegen-back";
import form from "./queries/form";
import forms from "./queries/forms";
import formPdf from "./queries/formPdf";
import appendixForms from "./queries/appendixForms";
import formsLifeCycle from "./queries/formsLifeCycle";
import formRevisionRequests from "./queries/formRevisionRequests";
import getCityNameByInseeCode from "./queries/getCityNameByInseeCode";
import getCommuneByCoordinates from "./queries/getCommuneByCoordinates";

export type FormQueryResolvers = Pick<
  QueryResolvers,
  | "form"
  | "forms"
  | "formPdf"
  | "appendixForms"
  | "formsLifeCycle"
  | "formRevisionRequests"
  | "getCityNameByInseeCode"
  | "getCommuneByCoordinates"
>;

const Query: FormQueryResolvers = {
  form,
  forms,
  formPdf,
  appendixForms,
  formsLifeCycle,
  formRevisionRequests: formRevisionRequests as any,
  getCityNameByInseeCode,
  getCommuneByCoordinates
};

export default Query;
