import React, { useCallback } from "react";
import SignOperationModal from "../Bsda/SignOperation/SignOperationModal";
import SignTransportModal from "../Bsda/SignTransport/SignTransportModal";
import SignEmissionModal from "../Bsda/SignEmission/SignEmissionModal";
import { Bsda, BsdaStatus } from "generated/graphql/types";
import { isCollection_2710 } from "Apps/Dashboard/dashboardServices";
import SignWorkModal from "../Bsda/SignWork/SignWorkModal";

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
  onClose,
}: ActBsdaValidationProps) => {
  const renderInitialModal = useCallback(() => {
    if (
      isCollection_2710(bsd["bsdaType"]) &&
      currentSiret === bsd.destination?.company?.siret
    ) {
      return (
        <SignOperationModal
          siret={currentSiret}
          bsdaId={bsd.id}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }

    if (
      bsd.emitter?.isPrivateIndividual &&
      bsd.worker?.isDisabled &&
      currentSiret === bsd.transporter?.company?.orgId
    ) {
      return (
        <SignTransportModal
          siret={currentSiret}
          bsdaId={bsd.id}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }

    if (
      bsd.emitter?.isPrivateIndividual &&
      currentSiret === bsd.worker?.company?.siret
    ) {
      return (
        <SignWorkModal
          siret={currentSiret}
          bsdaId={bsd.id}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }

    if (currentSiret === bsd.emitter?.company?.siret) {
      return (
        <SignEmissionModal
          siret={currentSiret}
          bsdaId={bsd.id}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
  }, [bsd, currentSiret, isOpen, onClose]);

  const renderSignedByProducerModal = useCallback(() => {
    if (
      bsd["bsdaType"] === "GATHERING" ||
      bsd["bsdaType"] === "RESHIPMENT" ||
      bsd.worker?.isDisabled
    ) {
      return (
        <SignTransportModal
          siret={currentSiret}
          bsdaId={bsd.id}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
    return (
      <SignWorkModal
        siret={currentSiret}
        bsdaId={bsd.id}
        isOpen={isOpen}
        onClose={onClose}
      />
    );
  }, [bsd, currentSiret, isOpen, onClose]);
  const renderSignedByWorkerModal = useCallback(() => {
    return (
      <SignTransportModal
        siret={currentSiret}
        bsdaId={bsd.id}
        isOpen={isOpen}
        onClose={onClose}
      />
    );
  }, [bsd.id, currentSiret, isOpen, onClose]);
  const renderSentModal = useCallback(() => {
    return (
      <SignOperationModal
        siret={currentSiret}
        bsdaId={bsd.id}
        isOpen={isOpen}
        onClose={onClose}
      />
    );
  }, [bsd.id, currentSiret, isOpen, onClose]);

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
