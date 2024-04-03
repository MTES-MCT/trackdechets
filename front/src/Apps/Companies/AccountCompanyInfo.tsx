import React from "react";
import AccountFieldCompanyTypes from "../Account/fields/AccountFieldCompanyTypes";
import AccountFieldNotEditable from "../Account/fields/AccountFieldNotEditable";
import AccountFieldCompanyGerepId from "../Account/fields/AccountFieldCompanyGerepId";
import AccountFieldCompanyGivenName, {
  tooltip as givenNameTooltip
} from "../Account/fields/AccountFieldCompanyGivenName";
import { CompanyPrivate, UserRole, CompanyType } from "@td/codegen-ui";

import AccountFieldCompanyTransporterReceipt from "../Account/fields/AccountFieldCompanyTransporterReceipt";
import AccountFieldCompanyTraderReceipt from "../Account/fields/AccountFieldCompanyTraderReceipt";
import AccountFieldCompanyBrokerReceipt from "../Account/fields/AccountFieldCompanyBrokerReceipt";
import AccountFieldCompanyVerificationStatus from "../Account/fields/AccountFieldCompanyVerificationStatus";
import AccountFieldCompanyVhuAgrementBroyeur from "../Account/fields/AccountFieldCompanyVhuAgrementBroyeur";
import AccountFieldCompanyVhuAgrementDemolisseur from "../Account/fields/AccountFieldCompanyVhuAgrementDemolisseur";
import AccountFieldCompanyWorkerCertification from "../Account/fields/AccountFieldCompanyWorkerCertification";
import { isSiret, isVat, PROFESSIONALS } from "@td/constants";
import AccountInfoAutoUpdate from "../Account/fields/AccountInfoAutoUpdate";

type Props = { company: CompanyPrivate };

const { VITE_VERIFY_COMPANY } = import.meta.env;

export default function AccountCompanyInfo({ company }: Props) {
  const isAdmin = company.userRole === UserRole.Admin;

  const isWasteProfessional = company.companyTypes.some(ct =>
    PROFESSIONALS.includes(ct)
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
