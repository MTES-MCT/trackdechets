import { Highlight } from "@codegouvfr/react-dsfr/Highlight";
import { CompanyPrivate, CompanyType, WasteVehiclesType } from "@td/codegen-ui";
import React from "react";
import {
  COLLECTOR_TYPE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  WASTE_PROCESSOR_TYPE_OPTIONS,
  formatDateViewDisplay
} from "../common/utils";

interface CompanyProfileFormProps {
  company: CompanyPrivate;
}

function getFormattedCompanyTypes(companyTypes: CompanyType[]) {
  const companyTypesFormatted = companyTypes.map(companyType => {
    const companyTypeObj = COMPANY_TYPE_OPTIONS.find(
      constant => constant.value === companyType
    );
    return {
      label: companyTypeObj?.label,
      isChecked: true,
      value: companyTypeObj?.value,
      helpText: companyTypeObj?.helpText
    };
  });

  const companyTypesAllValues = COMPANY_TYPE_OPTIONS.map(companyType => {
    const companyTypeInitial = companyTypesFormatted?.find(
      c => c.value === companyType.value
    );
    if (companyTypeInitial) {
      return companyTypeInitial;
    }
    return { ...companyType, isChecked: false };
  });

  return companyTypesAllValues;
}

const CompanyProfileInformation = ({ company }: CompanyProfileFormProps) => {
  const companyTypesFormatted = getFormattedCompanyTypes(company.companyTypes);
  return (
    <ul data-testid="company-types">
      {companyTypesFormatted.map(companyType => {
        return (
          companyType.isChecked && (
            <li key={companyType.value}>
              {companyType.label}

              {companyType.value === CompanyType.Worker && (
                <div data-testid="company-worker-section">
                  <Highlight>
                    <p className="companyFormWrapper__title-field">
                      Travaux relevant de la sous-section 4
                    </p>
                    <p className="companyFormWrapper__value-field">
                      {company.workerCertification?.hasSubSectionFour
                        ? "✅"
                        : "❌"}
                    </p>
                    <p className="companyFormWrapper__title-field">
                      Travaux relevant de la sous-section 3
                    </p>
                    <p className="companyFormWrapper__value-field">
                      {company.workerCertification?.hasSubSectionThree
                        ? "✅"
                        : "❌"}
                    </p>
                    {company.workerCertification?.hasSubSectionThree && (
                      <>
                        <p className="companyFormWrapper__title-field">
                          Numéro de certification
                        </p>
                        <p
                          data-testid="certificationNumber"
                          className="companyFormWrapper__value-field"
                        >
                          {company.workerCertification.certificationNumber}
                        </p>
                        <p className="companyFormWrapper__title-field">
                          Date de validité
                        </p>
                        <p
                          data-testid="validityLimit"
                          className="companyFormWrapper__value-field"
                        >
                          {formatDateViewDisplay(
                            company.workerCertification.validityLimit
                          )}
                        </p>
                        <p className="companyFormWrapper__title-field">
                          Organisme
                        </p>
                        <p
                          data-testid="organisation"
                          className="companyFormWrapper__value-field"
                        >
                          {company.workerCertification.organisation}
                        </p>
                      </>
                    )}
                  </Highlight>
                </div>
              )}
              {companyType.value === CompanyType.Broker && (
                <div data-testid="brokerReceipt">
                  <Highlight>
                    <p className="companyFormWrapper__title-field">
                      Numéro de récépissé
                    </p>
                    <p
                      data-testid="receiptNumber"
                      className="companyFormWrapper__value-field"
                    >
                      {company.brokerReceipt?.receiptNumber || "-"}
                    </p>
                    <p className="companyFormWrapper__title-field">
                      Limite de validité
                    </p>
                    <p
                      data-testid="receiptValidityLimit"
                      className="companyFormWrapper__value-field"
                    >
                      {formatDateViewDisplay(
                        company.brokerReceipt?.validityLimit
                      ) || "-"}
                    </p>
                    <p className="companyFormWrapper__title-field">
                      Département
                    </p>
                    <p
                      data-testid="receiptDepartment"
                      className="companyFormWrapper__value-field"
                    >
                      {company.brokerReceipt?.department || "-"}
                    </p>
                  </Highlight>
                </div>
              )}
              {companyType.value === CompanyType.Trader && (
                <div data-testid="traderReceipt">
                  <Highlight>
                    <p className="companyFormWrapper__title-field">
                      Numéro de récépissé
                    </p>
                    <p
                      data-testid="receiptNumber"
                      className="companyFormWrapper__value-field"
                    >
                      {company.traderReceipt?.receiptNumber || "-"}
                    </p>
                    <p className="companyFormWrapper__title-field">
                      Limite de validité
                    </p>
                    <p
                      data-testid="receiptValidityLimit"
                      className="companyFormWrapper__value-field"
                    >
                      {formatDateViewDisplay(
                        company.traderReceipt?.validityLimit
                      ) || "-"}
                    </p>
                    <p className="companyFormWrapper__title-field">
                      Département
                    </p>
                    <p
                      data-testid="receiptDepartment"
                      className="companyFormWrapper__value-field"
                    >
                      {company.traderReceipt?.department || "-"}
                    </p>
                  </Highlight>
                </div>
              )}
              {companyType.value === CompanyType.Transporter && (
                <div data-testid="transporterReceipt">
                  <Highlight>
                    <p className="companyFormWrapper__title-field">
                      Numéro de récépissé
                    </p>
                    <p
                      data-testid="receiptNumber"
                      className="companyFormWrapper__value-field"
                    >
                      {company.transporterReceipt?.receiptNumber || "-"}
                    </p>
                    <p className="companyFormWrapper__title-field">
                      Limite de validité
                    </p>
                    <p
                      data-testid="receiptValidityLimit"
                      className="companyFormWrapper__value-field"
                    >
                      {formatDateViewDisplay(
                        company.transporterReceipt?.validityLimit
                      ) || "-"}
                    </p>
                    <p className="companyFormWrapper__title-field">
                      Département
                    </p>
                    <p
                      data-testid="receiptDepartment"
                      className="companyFormWrapper__value-field"
                    >
                      {company.transporterReceipt?.department || "-"}
                    </p>
                  </Highlight>
                </div>
              )}
              {companyType.value === CompanyType.WasteVehicles &&
                company.wasteVehiclesTypes.includes(
                  WasteVehiclesType.Broyeur
                ) && (
                  <div data-testid="wasteVehiculesReceipt">
                    <Highlight>
                      <p className="companyFormWrapper__title-field">
                        Broyeur VHU
                      </p>
                      <p className="companyFormWrapper__value-field">
                        {"Numéro récépissé : "}
                        <span data-testid="vhuAgrementBroyeur_agrementNumber">
                          {company.vhuAgrementBroyeur?.agrementNumber || " - "}
                        </span>
                        <br />
                        Département {" : "}
                        <span data-testid="vhuAgrementBroyeur_department">
                          {company.vhuAgrementBroyeur?.department || " - "}
                        </span>
                      </p>
                    </Highlight>
                  </div>
                )}
              {companyType.value === CompanyType.WasteVehicles &&
                company.wasteVehiclesTypes.includes(
                  WasteVehiclesType.Demolisseur
                ) && (
                  <div data-testid="wasteVehiculesReceipt">
                    <Highlight>
                      <p className="companyFormWrapper__title-field">
                        Casse automobile / démolisseur
                      </p>
                      <p className="companyFormWrapper__value-field">
                        {"Numéro récépissé  : "}
                        <span data-testid="vhuAgrementDemolisseur_agrementNumber">
                          {company.vhuAgrementDemolisseur?.agrementNumber ||
                            " - "}
                        </span>
                        <br />
                        Département {" : "}
                        <span data-testid="vhuAgrementDemolisseur_department">
                          {company.vhuAgrementDemolisseur?.department || " - "}
                        </span>
                      </p>
                    </Highlight>
                  </div>
                )}
              {companyType.value === CompanyType.Wasteprocessor && (
                <Highlight>
                  {company.wasteProcessorTypes?.map(wasteProcessorType => {
                    const wasteProcessorFound =
                      WASTE_PROCESSOR_TYPE_OPTIONS.find(
                        option => option.value === wasteProcessorType
                      );
                    if (wasteProcessorFound) {
                      return (
                        <p key={wasteProcessorFound.value}>
                          {wasteProcessorFound.label}
                        </p>
                      );
                    }
                    return null;
                  })}
                </Highlight>
              )}
              {companyType.value === CompanyType.Collector && (
                <Highlight>
                  {company.collectorTypes?.map(collector => {
                    const collectorFound = COLLECTOR_TYPE_OPTIONS.find(
                      option => option.value === collector
                    );
                    if (collectorFound) {
                      return (
                        <p key={collectorFound.value}>{collectorFound.label}</p>
                      );
                    }
                    return null;
                  })}
                </Highlight>
              )}
              <br />
            </li>
          )
        );
      })}
    </ul>
  );
};
export default CompanyProfileInformation;
