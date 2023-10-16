import React from "react";
import { Bsvhu, BsvhuStatus } from "generated/graphql/types";
import SignEmissionModal from "../Bsvhu/SignEmission/SignEmissionModal";
import SignTransportModal from "../Bsvhu/SignTransport/SignTransportModal";
import SignOperationModal from "../Bsvhu/SignOperation/SignOperationModal";

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
  onClose,
}: ActBsvhuValidationProps) => {
  const renderInitialModal = () => {
    return (
      <SignEmissionModal
        bsvhuId={bsd.id}
        siret={currentSiret}
        onClose={onClose}
        isOpen={isOpen}
      />
    );
  };

  const renderSignedByProducerModal = () => {
    return (
      <SignTransportModal
        bsvhuId={bsd.id}
        siret={currentSiret}
        onClose={onClose}
        isOpen={isOpen}
      />
    );
  };

  const renderSentModal = () => {
    return (
      <SignOperationModal
        bsvhuId={bsd.id}
        siret={currentSiret}
        onClose={onClose}
        isOpen={isOpen}
      />
    );
  };

  const status = bsd["bsvhuStatus"];
  return (
    <>
      {status === BsvhuStatus.Initial && renderInitialModal()}
      {status === BsvhuStatus.SignedByProducer && renderSignedByProducerModal()}
      {status === BsvhuStatus.Sent && renderSentModal()}
    </>
  );
};

export default ActBsvhuValidation;
