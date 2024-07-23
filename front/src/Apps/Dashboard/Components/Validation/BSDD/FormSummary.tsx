import * as React from "react";
import { Form } from "@td/codegen-ui";
import { DsfrFormWasteSummary } from "./FormWasteSummary";

interface FormSummaryProps {
  form: Form;
}

export function FormSummary({ form }: Readonly<FormSummaryProps>) {
  return <DsfrFormWasteSummary form={form} />;
}
