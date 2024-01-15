import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormCompanyAddWorkerCertification from "./forms/AccountFormCompanyWorkerCertification";
import { formatDate } from "../../common/datetime";

type Props = {
  company: Pick<
    CompanyPrivate,
    "id" | "siret" | "workerCertification" | "userRole"
  >;
};

AccountFieldCompanyWorkerCertification.fragments = {
  company: gql`
    fragment AccountFieldCompanyWorkerCertificationFragment on CompanyPrivate {
      id
      siret
      userRole
      workerCertification {
        id
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
    }
  `
};

export default function AccountFieldCompanyWorkerCertification({
  company
}: Props) {
  const workerCertification = company.workerCertification ? (
    <table>
      <tbody>
        <tr>
          <td>Travaux relevant de la sous-section 4</td>
          <td>{company.workerCertification.hasSubSectionFour ? "✅" : "❌"}</td>
        </tr>
        <tr>
          <td>Travaux relevant de la sous-section 3</td>
          <td>
            {company.workerCertification.hasSubSectionThree ? "✅" : "❌"}
          </td>
        </tr>
        {company.workerCertification.hasSubSectionThree && (
          <>
            <tr>
              <td>Numéro de certification</td>
              <td>{company.workerCertification.certificationNumber}</td>
            </tr>
            <tr>
              <td>Date de validité</td>
              <td>{formatDate(company.workerCertification.validityLimit!)}</td>
            </tr>
            <tr>
              <td>Organisme</td>
              <td>{company.workerCertification.organisation}</td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  ) : (
    "Non renseignée"
  );

  return company.userRole === UserRole.Admin ? (
    <AccountField
      name="workerCertification"
      label="Catégorie entreprise de travaux amiante"
      value={workerCertification}
      renderForm={toggleEdition => (
        <AccountFormCompanyAddWorkerCertification
          company={company}
          toggleEdition={toggleEdition}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name="workerCertification"
      label="Catégorie entreprise de travaux amiante"
      value={workerCertification}
    />
  );
}
