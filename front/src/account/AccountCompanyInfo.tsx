import React from "react";
import { gql } from "@apollo/client";
import AccountFieldCompanyTypes from "./fields/AccountFieldCompanyTypes";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";
import AccountFieldCompanyGerepId from "./fields/AccountFieldCompanyGerepId";
import AccountFieldCompanyGivenName, {
  tooltip as givenNameTooltip
} from "./fields/AccountFieldCompanyGivenName";
import { CompanyPrivate, UserRole, CompanyType } from "@td/codegen-ui";

import AccountFieldCompanyTransporterReceipt from "./fields/AccountFieldCompanyTransporterReceipt";
import AccountFieldCompanyTraderReceipt from "./fields/AccountFieldCompanyTraderReceipt";
import AccountFieldCompanyBrokerReceipt from "./fields/AccountFieldCompanyBrokerReceipt";
import AccountFieldCompanyVerificationStatus from "./fields/AccountFieldCompanyVerificationStatus";
import AccountFieldCompanyVhuAgrementBroyeur from "./fields/AccountFieldCompanyVhuAgrementBroyeur";
import AccountFieldCompanyVhuAgrementDemolisseur from "./fields/AccountFieldCompanyVhuAgrementDemolisseur";
import AccountFieldCompanyWorkerCertification from "./fields/AccountFieldCompanyWorkerCertification";
import * as COMPANY_CONSTANTS from "@td/constants";
import { isSiret, isVat } from "@td/constants";
import AccountInfoAutoUpdate from "./fields/AccountInfoAutoUpdate";

type Props = { company: CompanyPrivate };

AccountCompanyInfo.fragments = {
  company: gql`
    fragment AccountCompanyInfoFragment on CompanyPrivate {
      id
      orgId
      name
      siret
      vatNumber
      address
      naf
      libelleNaf
      userRole
      givenName
      ...AccountFieldCompanyTypesFragment
      ...AccountFieldCompanyGerepIdFragment
      ...AccountFieldCompanyGivenNameFragment
      ...AccountFieldCompanyTransporterReceiptFragment
      ...AccountFieldCompanyTraderReceiptFragment
      ...AccountFieldCompanyBrokerReceiptFragment
      ...AccountFieldCompanyVerificationStatusFragment
      ...AccountFieldCompanyVhuAgrementBroyeurFragment
      ...AccountFieldCompanyVhuAgrementDemolisseurFragment
      ...AccountFieldCompanyWorkerCertificationFragment
      installation {
        urlFiche
      }
    }
    ${AccountFieldCompanyTypes.fragments.company}
    ${AccountFieldCompanyGerepId.fragments.company}
    ${AccountFieldCompanyGivenName.fragments.company}
    ${AccountFieldCompanyTransporterReceipt.fragments.company}
    ${AccountFieldCompanyTraderReceipt.fragments.company}
    ${AccountFieldCompanyBrokerReceipt.fragments.company}
    ${AccountFieldCompanyVerificationStatus.fragments.company}
    ${AccountFieldCompanyVhuAgrementBroyeur.fragments.company}
    ${AccountFieldCompanyVhuAgrementDemolisseur.fragments.company}
    ${AccountFieldCompanyWorkerCertification.fragments.company}
  `
};

const { VITE_VERIFY_COMPANY } = import.meta.env;

export default function AccountCompanyInfo({ company }: Props) {
  const isAdmin = company.userRole === UserRole.Admin;

  const isWasteProfessional = company.companyTypes.some(ct =>
    COMPANY_CONSTANTS.PROFESSIONALS.includes(ct)
  );
  return (
    <>
      <div className="tw-flex">
        {isSiret(
          company.siret!,
          import.meta.env.VITE_ALLOW_TEST_COMPANY === "true"
        ) && (
          <AccountFieldNotEditable
            name="siret"
            label="Numéro SIRET"
            value={company.siret}
            insideForm={
              isAdmin ? <AccountInfoAutoUpdate company={company} /> : undefined
            }
          />
        )}
        {isVat(company.vatNumber!) && (
          <AccountFieldNotEditable
            name="vatNumber"
            label="Numéro de TVA intra-communautaire"
            value={company.vatNumber}
            insideForm={
              isAdmin ? <AccountInfoAutoUpdate company={company} /> : undefined
            }
          />
        )}
      </div>
      <AccountFieldNotEditable
        name="naf"
        label="Code NAF"
        value={`${company.naf} - ${company.libelleNaf}`}
      />
      <AccountFieldNotEditable
        name="adresse"
        label="Adresse"
        value={company.address}
      />
      {company.installation && company.installation.urlFiche && (
        <AccountFieldNotEditable
          name="fiche_ic"
          label="Fiche ICPE"
          value={
            <a
              href={company.installation.urlFiche}
              target="_blank"
              rel="noopener noreferrer"
            >
              Lien
            </a>
          }
        />
      )}
      <AccountFieldCompanyGerepId company={company} />
      <AccountFieldCompanyTypes company={company} />
      {isWasteProfessional && VITE_VERIFY_COMPANY === "true" && (
        <AccountFieldCompanyVerificationStatus company={company} />
      )}
      {company.companyTypes.includes(CompanyType.Transporter) && (
        <AccountFieldCompanyTransporterReceipt company={company} />
      )}
      {company.companyTypes.includes(CompanyType.Trader) && (
        <AccountFieldCompanyTraderReceipt company={company} />
      )}
      {company.companyTypes.includes(CompanyType.Broker) && (
        <AccountFieldCompanyBrokerReceipt company={company} />
      )}
      {company.companyTypes.includes(CompanyType.WasteVehicles) && (
        <>
          <AccountFieldCompanyVhuAgrementBroyeur company={company} />
          <AccountFieldCompanyVhuAgrementDemolisseur company={company} />
        </>
      )}
      {company.companyTypes.includes(CompanyType.Worker) && (
        <AccountFieldCompanyWorkerCertification company={company} />
      )}
      {isAdmin ? (
        <AccountFieldCompanyGivenName company={company} />
      ) : (
        company.givenName && (
          <AccountFieldNotEditable
            name="givenName"
            label="Nom usuel"
            tooltip={givenNameTooltip}
            value={company.givenName}
          />
        )
      )}
    </>
  );
}
