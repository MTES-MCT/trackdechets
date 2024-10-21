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
  const canIrregularSituationSignNoSiret =
    status === BsvhuStatus.Initial &&
    bsd.emitter?.irregularSituation &&
    bsd.emitter?.noSiret;

  const canIrregularSituationSignWithSiret =
    status === BsvhuStatus.Initial &&
    bsd.emitter?.irregularSituation &&
    !bsd.emitter?.noSiret &&
    bsd.emitter?.company?.siret === currentSiret;

  const canIrregularSituationSignWithSiretNotRegistered =
    status === BsvhuStatus.Initial &&
    bsd.emitter?.irregularSituation &&
    !bsd.emitter?.noSiret &&
    bsd.emitter?.company?.siret !== currentSiret &&
    bsd.transporter?.company?.siret === currentSiret;

  const canSignWithNotIrregular =
    status === BsvhuStatus.Initial && !bsd.emitter?.irregularSituation;

  return (
    <>
      {status === BsvhuStatus.Initial &&
        canSignWithNotIrregular &&
        renderInitialModal()}
      {status === BsvhuStatus.Initial &&
        canIrregularSituationSignWithSiret &&
        renderInitialModal()}
      {(status === BsvhuStatus.SignedByProducer ||
        (status === BsvhuStatus.Initial &&
          (canIrregularSituationSignNoSiret ||
            canIrregularSituationSignWithSiretNotRegistered))) &&
        renderSignedByProducerModal()}
      {status === BsvhuStatus.Sent && renderSentModal()}
    </>
  );
};

export default ActBsvhuValidation;
