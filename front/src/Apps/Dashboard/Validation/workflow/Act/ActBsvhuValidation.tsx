import React from "react";
import { Bsvhu, BsvhuStatus } from "@td/codegen-ui";
import { SignEmission } from "../../../../../dashboard/components/BSDList/BSVhu/WorkflowAction/SignEmission";
import { SignTransport } from "../../../../../dashboard/components/BSDList/BSVhu/WorkflowAction/SignTransport";
import { SignOperation } from "../../../../../dashboard/components/BSDList/BSVhu/WorkflowAction/SignOperation";

interface ActBsvhuValidationProps {
  bsd: Bsvhu;
  currentSiret: string;
  isOpen: boolean;
  onClose: () => void;
}
const ActBsvhuValidation = ({
  bsd,
  currentSiret,
  isOpen,
  onClose
}: ActBsvhuValidationProps) => {
  const actionButtonAdapterProps = {
    isModalOpenFromParent: isOpen,
    onModalCloseFromParent: onClose,
    displayActionButton: false
  };

  const renderInitialModal = () => {
    return (
      <SignEmission
        bsvhuId={bsd.id}
        siret={currentSiret}
        {...actionButtonAdapterProps}
      />
    );
  };

  const renderSignedByProducerModal = () => {
    return (
      <SignTransport
        bsvhuId={bsd.id}
        siret={currentSiret}
        {...actionButtonAdapterProps}
      />
    );
  };

  const renderSentModal = () => {
    return (
      <SignOperation
        bsvhuId={bsd.id}
        siret={currentSiret}
        {...actionButtonAdapterProps}
      />
    );
  };

  const status = bsd["bsvhuStatus"];
  const canIrregularSituationSign =
    status === BsvhuStatus.Initial && bsd.emitter?.irregularSituation;
  return (
    <>
      {status === BsvhuStatus.Initial && renderInitialModal()}
      {(status === BsvhuStatus.SignedByProducer || canIrregularSituationSign) &&
        renderSignedByProducerModal()}
      {status === BsvhuStatus.Sent && renderSentModal()}
    </>
  );
};

export default ActBsvhuValidation;
