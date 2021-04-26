import TdModal from "common/components/Modal";
import { gql, useMutation } from "@apollo/client";
import React from "react";
import styles from "./CompanyVerifyModal.module.scss";
import { CompanyForVerification, Mutation } from "generated/graphql/types";
import { NotificationError } from "common/components/Error";

type VerifyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyForVerification;
};

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

export default function SendVerificationCodeLetterModal({
  isOpen,
  onClose,
  company,
}: VerifyModalProps) {
  const [sendVerificationCodeLetter, { error, loading }] = useMutation<
    Pick<Mutation, "sendVerificationCodeLetter">,
    any
  >(SEND_VERIFICATION_CODE_LETTER, {
    onCompleted: onClose,
  });

  function onSubmit() {
    return sendVerificationCodeLetter({
      variables: {
        input: {
          siret: company.siret,
        },
      },
    });
  }

  return (
    <TdModal
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      ariaLabel="Envoyer un courrier"
    >
      <div className={styles.VerifyModal}>
        <h2 className="td-modal-title">Envoyer un courrier</h2>
        <div className="tw-mt-5">
          Vous êtes sur le point de faire envoyer un courrier contenant un code
          de sécurité à l'établissement {company.name} - {company.siret}
        </div>
        <div className="td-modal-actions">
          <button
            className="btn btn--outline-primary"
            onClick={() => onClose()}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            onClick={onSubmit}
          >
            <span>{loading ? "Envoi en cours..." : "Envoyer un courrier"}</span>
          </button>
        </div>
        <div>{error && <NotificationError apolloError={error} />}</div>
      </div>
    </TdModal>
  );
}
