import React from "react";
import { SignEmission } from "../../../../../dashboard/components/BSDList/BSDa/WorkflowAction/SignEmission";
import SignOperation from "../../../../../dashboard/components/BSDList/BSDa/WorkflowAction/SignOperation";
import SignTransport from "../../../../../dashboard/components/BSDList/BSDa/WorkflowAction/SignTransport";
import SignWork from "../../../../../dashboard/components/BSDList/BSDa/WorkflowAction/SignWork";
import { Bsda, BsdaStatus } from "codegen-ui";
import { isCollection_2710 } from "../../../dashboardServices";

interface ActBsdaValidationProps {
  bsd: Bsda;
  currentSiret: string;
  isOpen: boolean;
  onClose: () => void;
}
const ActBsdaValidation = ({
  bsd,
  currentSiret,
  isOpen,
  onClose
}: ActBsdaValidationProps) => {
  const actionButtonAdapterProps = {
    isModalOpenFromParent: isOpen,
    onModalCloseFromParent: onClose,
    displayActionButton: false
  };

  const renderInitialModal = () => {
    if (
      isCollection_2710(bsd["bsdaType"]) &&
      currentSiret === bsd.destination?.company?.siret
    ) {
      return (
        <SignOperation
          siret={currentSiret}
          bsdaId={bsd.id}
          {...actionButtonAdapterProps}
        />
      );
    }

    if (
      bsd.emitter?.isPrivateIndividual &&
      bsd.worker?.isDisabled &&
      currentSiret === bsd.transporter?.company?.orgId
    ) {
      return (
        <SignTransport
          siret={currentSiret}
          bsdaId={bsd.id}
          {...actionButtonAdapterProps}
        />
      );
    }

    if (
      bsd.emitter?.isPrivateIndividual &&
      currentSiret === bsd.worker?.company?.siret
    ) {
      return (
        <SignWork
          siret={currentSiret}
          bsdaId={bsd.id}
          {...actionButtonAdapterProps}
        />
      );
    }

    if (currentSiret === bsd.emitter?.company?.siret) {
      return (
        <SignEmission
          siret={currentSiret}
          bsdaId={bsd.id}
          {...actionButtonAdapterProps}
        />
      );
    }
  };

  const renderSignedByProducerModal = () => {
    if (
      bsd["bsdaType"] === "GATHERING" ||
      bsd["bsdaType"] === "RESHIPMENT" ||
      bsd.worker?.isDisabled
    ) {
      return (
        <SignTransport
          siret={currentSiret}
          bsdaId={bsd.id}
          {...actionButtonAdapterProps}
        />
      );
    }
    return (
      <SignWork
        siret={currentSiret}
        bsdaId={bsd.id}
        {...actionButtonAdapterProps}
      />
    );
  };
  const renderSignedByWorkerModal = () => {
    return (
      <SignTransport
        siret={currentSiret}
        bsdaId={bsd.id}
        {...actionButtonAdapterProps}
      />
    );
  };
  const renderSentModal = () => {
    return (
      <SignOperation
        siret={currentSiret}
        bsdaId={bsd.id}
        {...actionButtonAdapterProps}
      />
    );
  };

  const status = bsd["bsdaStatus"];
  return (
    <>
      {status === BsdaStatus.Initial && renderInitialModal()}
      {status === BsdaStatus.SignedByProducer && renderSignedByProducerModal()}
      {status === BsdaStatus.SignedByWorker && renderSignedByWorkerModal()}
      {status === BsdaStatus.Sent && renderSentModal()}
    </>
  );
};

export default React.memo(ActBsdaValidation);
