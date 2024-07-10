import React from "react";
import { AllCompanyType } from "../../utils";
import { CompanyType, WasteVehiclesType } from "@td/codegen-ui";
import BrokerRecepisseForm from "./BrokerRecepisseForm";
import TraderRecepisseForm from "./TraderRecepisseForm";
import TransporteurRecepisseForm from "./TransporteurRecepisseForm";
import WorkerCertificationForm from "./WorkerCertificationForm";
import VhuAgrementForm from "./VhuAgrementForm";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps,
  CompanyTypeInputValues
} from "./CompanyTypeForm";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import EcoOrganismeAgrementsForm from "./EcoOrganismeAgrementsForm";

type CertificationFormProps = {
  companyType: AllCompanyType;
  inputProps?: CompanyTypeInputProps;
  inputValues: CompanyTypeInputValues;
  inputErrors?: CompanyTypeInputErrors;
};

/**
 * Permet d'afficher le formulaire récépissé, agrément, etc
 * correspondant au type d'entreprise sélectionné.
 */
const CertificationForm: React.FC<CertificationFormProps> = ({
  companyType,
  inputProps,
  inputValues,
  inputErrors
}) => {
  if (companyType === CompanyType.Broker) {
    return (
      <Highlight className="fr-mb-8v">
        <BrokerRecepisseForm
          inputProps={{ brokerReceipt: inputProps?.brokerReceipt }}
          inputErrors={{ brokerReceipt: inputErrors?.brokerReceipt }}
        />
      </Highlight>
    );
  } else if (companyType === CompanyType.Trader) {
    return (
      <Highlight className="fr-mb-8v">
        <TraderRecepisseForm
          inputProps={{ traderReceipt: inputProps?.traderReceipt }}
          inputErrors={{ traderReceipt: inputErrors?.traderReceipt }}
        />
      </Highlight>
    );
  } else if (companyType === CompanyType.Transporter) {
    return (
      <Highlight className="fr-mb-8v">
        <TransporteurRecepisseForm
          inputProps={{ transporterReceipt: inputProps?.transporterReceipt }}
          inputErrors={{ transporterReceipt: inputErrors?.transporterReceipt }}
        />
      </Highlight>
    );
  } else if (companyType === CompanyType.Worker) {
    return (
      <Highlight className="fr-mb-8v">
        <WorkerCertificationForm
          inputValues={inputValues}
          inputProps={inputProps}
          inputErrors={inputErrors}
        />
      </Highlight>
    );
  } else if (companyType === CompanyType.EcoOrganisme) {
    return (
      <Highlight className="fr-mb-8v">
        <EcoOrganismeAgrementsForm
          inputValues={{
            ecoOrganismeAgreements: inputValues?.ecoOrganismeAgreements
          }}
          inputProps={{
            ecoOrganismeAgreements: inputProps?.ecoOrganismeAgreements
          }}
          inputErrors={{
            ecoOrganismeAgreements: inputErrors?.ecoOrganismeAgreements
          }}
        />
      </Highlight>
    );
  } else if (companyType === WasteVehiclesType.Broyeur) {
    return (
      <div className="fr-mb-5v">
        <VhuAgrementForm
          title="Agrément broyeur (optionnel)"
          inputProps={inputProps?.vhuAgrementBroyeur}
          inputErrors={inputErrors?.vhuAgrementBroyeur}
        />
      </div>
    );
  } else if (companyType === WasteVehiclesType.Demolisseur) {
    return (
      <VhuAgrementForm
        title="Agrément démolisseur / casse automobile (optionnel)"
        inputProps={inputProps?.vhuAgrementDemolisseur}
        inputErrors={inputErrors?.vhuAgrementDemolisseur}
      />
    );
  } else {
    return null;
  }
};

export default React.memo(CertificationForm);
