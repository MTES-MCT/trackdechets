import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import { CompanyPrivate, CompanyVerificationStatus } from "codegen-ui";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormVerifyCompany from "./forms/AccountFormVerifyCompany";

type Props = {
  company: CompanyPrivate;
};

AccountFieldCompanyVerificationStatus.fragments = {
  company: gql`
    fragment AccountFieldCompanyVerificationStatusFragment on CompanyPrivate {
      id
      orgId
      verificationStatus
    }
  `
};

const fieldLabel = "Profil vérifié";
const fieldName = "companyVerificationStatus";

const tooltip =
  "Les établissements inscrits en tant que professionnels du déchet (installation de traitement, TTR, négociant, transporteur, VHU) " +
  "doivent être vérifiés. La vérification permet de s'assurer que la personne inscrite en tant qu'administrateur " +
  "a bien les droits pour effectuer des actions pour le compte de l'établissement.";

export default function AccountFieldCompanyVerificationStatus({
  company
}: Props) {
  return company.verificationStatus ===
    CompanyVerificationStatus.ToBeVerified ? (
    <AccountFieldNotEditable
      name={fieldName}
      label={fieldLabel}
      tooltip={tooltip}
      value="En cours de vérification par l'équipe Trackdéchets."
    />
  ) : company.verificationStatus === CompanyVerificationStatus.LetterSent ? (
    <AccountField
      name={fieldName}
      label={fieldLabel}
      tooltip={tooltip}
      value="Un code de vérification a été envoyé par voie postale à l'adresse enregistrée au registre du commerce et des sociétés"
      modifier="Saisir le code"
      renderForm={toggleEdition => (
        <AccountFormVerifyCompany
          siret={company.orgId}
          toggleEdition={toggleEdition}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name={fieldName}
      label={fieldLabel}
      tooltip={tooltip}
      value="Oui"
    />
  );
}
