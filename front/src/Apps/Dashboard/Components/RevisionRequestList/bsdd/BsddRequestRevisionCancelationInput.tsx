import { Form as Bsdd, FormStatus } from "@td/codegen-ui";
import React from "react";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import {
  CANCELATION_MSG,
  CANCELATION_NOT_POSSIBLE_FOR_APPENDIX1_MSG,
  CANCELATION_NOT_POSSIBLE_MSG,
  CAN_BE_CANCELLED_LABEL
} from "../../Revision/wordingsRevision";

// If you modify this, also modify it in the backend
const CANCELLABLE_BSDD_STATUSES = [
  // FormStatus.Draft,
  // FormStatus.Sealed,
  FormStatus.SignedByProducer,
  FormStatus.Sent,
  // FormStatus.Received,
  // FormStatus.Accepted,
  // FormStatus.Processed,
  // FormStatus.FollowedWithPnttd,
  // FormStatus.AwaitingGroup,
  // FormStatus.Grouped,
  // FormStatus.NoTraceability,
  // FormStatus.Refused,
  FormStatus.TempStored,
  FormStatus.TempStorerAccepted,
  FormStatus.Resealed,
  FormStatus.SignedByTempStorer,
  FormStatus.Resent
  // FormStatus.Canceled,
];

interface Props {
  bsdd: Bsdd;
  onChange: (value) => void;
}

export function BsddRequestRevisionCancelationInput({ bsdd, onChange }: Props) {
  const isAppendix1 = bsdd.emitter?.type === "APPENDIX1";
  const canBeCancelled =
    CANCELLABLE_BSDD_STATUSES.includes(bsdd.status) && !isAppendix1;

  return (
    <div className="fr-mb-4v">
      <ToggleSwitch
        label={CAN_BE_CANCELLED_LABEL}
        disabled={!canBeCancelled}
        inputTitle="cancellation"
        onChange={onChange}
        showCheckedHint={false}
        helperText={
          isAppendix1
            ? CANCELATION_NOT_POSSIBLE_FOR_APPENDIX1_MSG
            : canBeCancelled
            ? CANCELATION_MSG
            : CANCELATION_NOT_POSSIBLE_MSG
        }
      />
      <hr className="fr-mt-2w" />
    </div>
  );
}
