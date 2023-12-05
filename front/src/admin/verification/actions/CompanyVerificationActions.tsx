import { CompanyForVerification } from "codegen-ui";
import React, { useState } from "react";
import CompanyVerifyModal from "./CompanyVerifyModal";
import SendVerificationCodeLetterModal from "./SendVerificationCodeLetterModal";
import { isSiret } from "shared/constants";

type VerificationActionsProps = {
  company: CompanyForVerification;
};

export default function CompanyVerificationActions({
  company
}: VerificationActionsProps) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const openVerifyModal = () => setShowVerifyModal(true);
  const closeVerifyModal = () => setShowVerifyModal(false);

  const [
    showSendVerificationCodeLetterModal,
    setSendVerificationCodeLetterModal
  ] = useState(false);
  const openSendVerificationCodeModal = () =>
    setSendVerificationCodeLetterModal(true);
  const closeSendVerificationCodeModal = () =>
    setSendVerificationCodeLetterModal(false);

  return (
    <div className="tw-flex tw-flex-col ">
      <button className="btn btn--primary" onClick={() => openVerifyModal()}>
        Vérifier
      </button>
      {isSiret(company.orgId) && (
        <button
          className="btn btn--primary tw-mt-1"
          onClick={() => openSendVerificationCodeModal()}
        >
          Envoyer un courrier
        </button>
      )}

      {showVerifyModal && (
        <CompanyVerifyModal
          isOpen={showVerifyModal}
          onClose={() => closeVerifyModal()}
          company={company}
        />
      )}

      {showSendVerificationCodeLetterModal && (
        <SendVerificationCodeLetterModal
          isOpen={showSendVerificationCodeLetterModal}
          onClose={() => closeSendVerificationCodeModal()}
          company={company}
        />
      )}
    </div>
  );
}
