import { Form, FormStatus } from "generated/graphql/types";
import React from "react";
import MarkAsSealed from "./MarkAsSealed";
import { getNextState } from "./workflow";
import MarkAsReceived from "./MarkAsReceived";
import MarkAsAccepted from "./MarkAsAccepted";
import MarkAsProcessed from "./MarkAsProcessed";
import MarkAsTempStored from "./MarkAsTempStored";
import MarkAsResealed from "./MarkAsResealed";
import MarkAsTempStorerAccepted from "./MarkAsTempStorerAccepted";

export interface WorkflowActionProps {
  form: Form;
  siret: string;
}

/**
 * Factory class returning the proper workflow action based on form status and siret
 */
export default function WorkflowAction(props: WorkflowActionProps) {
  const nextState = getNextState(props.form, props.siret);

  switch (nextState) {
    case FormStatus.Sealed:
      return <MarkAsSealed {...props} />;
    case FormStatus.Received:
      return <MarkAsReceived {...props} />;
    case FormStatus.Accepted:
      return <MarkAsAccepted {...props} />;
    case FormStatus.TempStored:
      return <MarkAsTempStored {...props} />;
    case FormStatus.TempStorerAccepted:
      return <MarkAsTempStorerAccepted {...props} />;
    case FormStatus.Resealed:
      return <MarkAsResealed {...props} />;
    case FormStatus.Processed:
      return <MarkAsProcessed {...props} />;
    default:
      return null;
  }
}
