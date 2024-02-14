import {
  CompanyForVerification,
  Mutation,
  MutationVerifyCompanyByAdminArgs
} from "@td/codegen-ui";
import React from "react";
import { isSiret } from "@td/constants";
import { gql, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";
import { Button } from "@codegouvfr/react-dsfr/Button";

const VERIFY_COMPANY_BY_ADMIN = gql`
  mutation VerifyCompanyByAdmin($input: VerifyCompanyByAdminInput!) {
    verifyCompanyByAdmin(input: $input) {
      id
      verificationStatus
      verificationComment
      verificationMode
    }
  }
`;

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
  const [sendVerificationCodeLetter, { loading: loadingLetter }] = useMutation<
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
  const [verifyCompanyByAdmin, { loading: loadingVerify }] = useMutation<
    Pick<Mutation, "verifyCompanyByAdmin">,
    MutationVerifyCompanyByAdminArgs
  >(VERIFY_COMPANY_BY_ADMIN, {
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

  function onVerify() {
    return verifyCompanyByAdmin({
      variables: {
        input: {
          siret: company.orgId!,
          verificationComment: ""
        }
      }
    });
  }

  return (
    <div className="tw-flex" style={{ justifyContent: "center" }}>
      {isSiret(company.orgId) && (
        <Button
          priority="secondary"
          iconId="fr-icon-mail-line"
          onClick={onSendVerificationCodeLetter}
          title="Envoyer un courrier"
          size="large"
          className="fr-mx-1w"
          disabled={loadingLetter}
        />
      )}

      <Button
        priority="primary"
        iconId="fr-icon-success-line"
        onClick={onVerify}
        disabled={loadingVerify}
        title="Vérifier"
        size="large"
        className="fr-mx-1w"
      />
    </div>
  );
}
