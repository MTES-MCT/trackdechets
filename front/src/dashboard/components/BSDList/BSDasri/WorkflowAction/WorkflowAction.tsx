import React from "react";
import { Bsdasri } from "generated/graphql/types";
import PublishBsdasri from "./PublishBsdasri";

export interface WorkflowActionProps {
  form: Bsdasri;
  siret: string;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { form } = props;

  if (form.isDraft) {
    return <PublishBsdasri {...props} />;
  }

  return null;
}
