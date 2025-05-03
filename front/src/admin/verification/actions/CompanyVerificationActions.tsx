import {
  CompanyForVerification,
  CompanyVerificationStatus,
  Mutation,
  MutationStandbyCompanyByAdminArgs,
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

const STANDBY_COMPANY_BY_ADMIN = gql`
  mutation StandbyCompanyByAdmin($input: StandbyCompanyByAdminInput!) {
    standbyCompanyByAdmin(input: $input) {
      id
      verificationStatus
      verificationComment
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
      toast.success("Courrier envoyé", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error("Le courrier n'a pas pu être envoyé", {
        duration: TOAST_DURATION
      });
    }
  });
  const [verifyCompanyByAdmin, { loading: loadingVerify }] = useMutation<
    Pick<Mutation, "verifyCompanyByAdmin">,
    MutationVerifyCompanyByAdminArgs
  >(VERIFY_COMPANY_BY_ADMIN, {
    onCompleted: () => {
      toast.success("Verification validée", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error("La vérification n'a pas pu être validée", {
        duration: TOAST_DURATION
      });
    }
  });
  const [standbyCompanyByAdmin, { loading: loadingStandby }] = useMutation<
    Pick<Mutation, "standbyCompanyByAdmin">,
    MutationStandbyCompanyByAdminArgs
  >(STANDBY_COMPANY_BY_ADMIN, {
    onCompleted: () => {
      toast.success("Statut mis à jour", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error("La requête n'a pas pu aboutir", {
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

  function onStandbyCompanyByAdmin(standby = true) {
    return standbyCompanyByAdmin({
      variables: {
        input: {
          orgId: company.orgId!,
          standby
        }
      }
    });
  }

  const unverifiedCompanyActions = (
    <div className="fr-container--fluid">
      {isSiret(company.orgId) && (
        <Button
          priority="secondary"
          iconId="fr-icon-mail-line"
          onClick={onSendVerificationCodeLetter}
          title="Envoyer un courrier"
          size="medium"
          className="fr-mr-1w"
          disabled={loadingLetter}
        />
      )}

      <Button
        priority="primary"
        iconId="fr-icon-success-line"
        onClick={onVerify}
        disabled={loadingVerify}
        title="Vérifier"
        size="medium"
        className="fr-mr-1w"
      />
    </div>
  );

  return (
    <div
      className="fr-container--fluid tw-flex"
      style={{ justifyContent: "center" }}
    >
      {company.verificationStatus === CompanyVerificationStatus.Standby && (
        <Button
          priority="secondary"
          iconId="fr-icon-play-circle-line"
          onClick={() => {
            onStandbyCompanyByAdmin(false);
          }}
          title="Rétablir"
          size="medium"
          className="fr-mr-1w"
          disabled={loadingStandby}
        />
      )}

      {company.verificationStatus ===
        CompanyVerificationStatus.ToBeVerified && (
        <Button
          priority="secondary"
          iconId="fr-icon-pause-circle-line"
          onClick={() => {
            onStandbyCompanyByAdmin(true);
          }}
          title="Mettre en stand by"
          size="medium"
          className="fr-mr-1w"
          disabled={loadingStandby}
        />
      )}

      {company.verificationStatus === CompanyVerificationStatus.ToBeVerified &&
        unverifiedCompanyActions}
    </div>
  );
}
