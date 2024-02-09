import { CompanyForVerification, Mutation } from "@td/codegen-ui";
import React, { useState } from "react";
import CompanyVerifyModal from "./CompanyVerifyModal";
import { isSiret } from "@td/constants";
import { gql, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";

const SEND_VERIFICATION_CODE_LETTER = gql`
  mutation SendVerificationCodeLetter(
    $input: SendVerificationCodeLetterInput!
  ) {
    sendVerificationCodeLetter(input: $input) {
      id
      verificationStatus
      verificationMode
    }
  }
`;

type VerificationActionsProps = {
  company: CompanyForVerification;
};

export default function CompanyVerificationActions({
  company
}: VerificationActionsProps) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const openVerifyModal = () => setShowVerifyModal(true);
  const closeVerifyModal = () => setShowVerifyModal(false);

  const [sendVerificationCodeLetter, { error, loading }] = useMutation<
    Pick<Mutation, "sendVerificationCodeLetter">,
    any
  >(SEND_VERIFICATION_CODE_LETTER, {
    onCompleted: () => {
      toast.success("Verification envoyée", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error("La vérification n'a pas pu être envoyée", {
        duration: TOAST_DURATION
      });
    }
  });

  function onSendVerificationCodeLetter() {
    if (isSiret(company.siret!)) {
      return sendVerificationCodeLetter({
        variables: {
          input: {
            siret: company.siret!
          }
        }
      });
    } else {
      toast.error(
        "La vérification n'a pas pu être envoyée, l'établissement ne possède pas de SIRET valide",
        {
          duration: TOAST_DURATION
        }
      );
    }
  }

  return (
    <div className="tw-flex tw-flex-col ">
      <button className="btn btn--primary" onClick={() => openVerifyModal()}>
        Vérifier
      </button>
      {isSiret(company.orgId) && (
        <button
          disabled={loading}
          className="btn btn--primary tw-mt-1"
          onClick={onSendVerificationCodeLetter}
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
    </div>
  );
}
