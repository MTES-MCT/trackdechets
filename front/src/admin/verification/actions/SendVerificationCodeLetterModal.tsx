import toast from "react-hot-toast";
import TdModal from "../../../Apps/common/Components/Modal/Modal";
import { gql, useMutation } from "@apollo/client";
import React from "react";
import styles from "./CompanyVerifyModal.module.scss";
import { CompanyForVerification, Mutation } from "codegen-ui";
import { NotificationError } from "../../../Apps/common/Components/Error/Error";
import { isSiret } from "shared/constants";
import { TOAST_DURATION } from "../../../common/config";

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
  company
}: VerifyModalProps) {
  const [sendVerificationCodeLetter, { error, loading }] = useMutation<
    Pick<Mutation, "sendVerificationCodeLetter">,
    any
  >(SEND_VERIFICATION_CODE_LETTER, {
    onCompleted: () => {
      toast.success("Verification envoyée", { duration: TOAST_DURATION });
      return onClose();
    },
    onError: () => {
      toast.error("La vérification n'a pas pu être envoyée", {
        duration: TOAST_DURATION
      });
    }
  });

  function onSubmit() {
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
          Vous êtes sur le point d'envoyer un courrier contenant un code de
          vérification à l'établissement {company.name} - {company.orgId}
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
