import { gql } from "@apollo/client";
import { CompanyPrivate, UserRole } from "generated/graphql/types";
import React from "react";
import AccountField from "./AccountField";
import { AccountFormCompanySignatureAutomation } from "./forms/AccountFormCompanySignatureAutomation";
import AccountFieldNotEditable from "./AccountFieldNotEditable";

type Props = {
  company: Pick<CompanyPrivate, "id" | "signatureAutomations" | "userRole">;
};

AccountFieldCompanySignatureAutomation.fragments = {
  company: gql`
    fragment AccountFieldCompanySignatureAutomationFragment on CompanyPrivate {
      siret
      signatureAutomations {
        id
        createdAt
        to {
          siret
          vatNumber
          name
        }
      }
    }
  `,
};

export function AccountFieldCompanySignatureAutomation({ company }: Props) {
  const fieldName = "signatureAutomations";
  const fieldLabel = "Signature automatique (annexe 1)";

  const value =
    company.signatureAutomations.length > 0
      ? company.signatureAutomations
          .map(
            Automation =>
              `${Automation.to.name} (${
                Automation.to.siret ?? Automation.to.vatNumber
              })`
          )
          .join(", ")
      : "Aucune entreprise autorisée";

  return company.userRole === UserRole.Admin ? (
    <AccountField
      name={fieldName}
      label={fieldLabel}
      value={value}
      renderForm={toggleEdition => (
        <AccountFormCompanySignatureAutomation
          company={company}
          toggleEdition={toggleEdition}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name={fieldName}
      label={fieldLabel}
      value={value}
    />
  );
}
