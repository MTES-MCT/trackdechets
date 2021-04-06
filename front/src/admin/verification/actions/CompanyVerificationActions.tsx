import { CompanyForVerification } from "generated/graphql/types";
import React, { useState } from "react";
import CompanyVerifyModal from "./CompanyVerifyModal";
import "@reach/menu-button/styles.css";

type VerificationActionsProps = {
  company: CompanyForVerification;
};

export default function CompanyVerificationActions({
  company,
}: VerificationActionsProps) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const openVerifyModal = () => setShowVerifyModal(true);
  const closeVerifyModal = () => setShowVerifyModal(false);

  return (
    <>
      <button className="btn btn--primary" onClick={() => openVerifyModal()}>
        Vérifier
      </button>

      {showVerifyModal && (
        <CompanyVerifyModal
          isOpen={showVerifyModal}
          onClose={() => closeVerifyModal()}
          company={company}
        />
      )}
    </>
  );
}
