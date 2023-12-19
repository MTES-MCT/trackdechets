import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormAgreements from "./forms/AccountFormAgreements";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import styles from "./AccountField.module.scss";

interface Props {
  company: Pick<CompanyPrivate, "id" | "userRole" | "ecoOrganismeAgreements">;
}

AccountFieldCompanyAgreements.fragments = {
  company: gql`
    fragment AccountFieldCompanyAgreementsFragment on CompanyPrivate {
      siret
      userRole
      ecoOrganismeAgreements
    }
  `
};

export default function AccountFieldCompanyAgreements({ company }: Props) {
  const fieldName = "ecoOrganismeAgreements";
  const fieldLabel = "Agréments éco-organisme";

  const agreements =
    company.ecoOrganismeAgreements.length > 0 ? (
      <ul>
        {company.ecoOrganismeAgreements.map((agreement, index) => (
          <li key={index}>
            <span className={styles.ellipsis}>{agreement}</span>
          </li>
        ))}
      </ul>
    ) : null;

  return company.userRole === UserRole.Admin ? (
    <AccountField
      name={fieldName}
      label={fieldLabel}
      value={agreements}
      renderForm={toggleEdition => (
        <AccountFormAgreements
          name={fieldName}
          ecoOrganismeAgreements={company.ecoOrganismeAgreements}
          id={company.id}
          toggleEdition={toggleEdition}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name={fieldName}
      label={fieldLabel}
      value={agreements}
    />
  );
}
