import React from "react";
import {
  AllCompanyType,
  COMPANY_TYPE_OPTIONS,
  WORKER_AGREMENT_ORGANISATION_OPTIONS
} from "../../utils";
import CompanyTypeCheckbox from "./CompanyTypeCheckbox";
import { InputProps } from "@codegouvfr/react-dsfr/Input";
import { SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import "./CompanyTypeForm.scss";

export type CompanyTypeInputValues = {
  companyTypes: string[];
  workerCertification: {
    hasSubSectionThree: boolean;
  };
  ecoOrganismePartnersIds: string[];
  ecoOrganismeAgreements: string[];
};

export type CompanyTypeInputProps = {
  transporterReceipt?: {
    receiptNumber?: InputProps["nativeInputProps"];
    validityLimit?: InputProps["nativeInputProps"];
    department?: InputProps["nativeInputProps"];
  };
  brokerReceipt?: {
    receiptNumber?: InputProps["nativeInputProps"];
    validityLimit?: InputProps["nativeInputProps"];
    department?: InputProps["nativeInputProps"];
  };
  traderReceipt?: {
    receiptNumber?: InputProps["nativeInputProps"];
    validityLimit?: InputProps["nativeInputProps"];
    department?: InputProps["nativeInputProps"];
  };
  vhuAgrementBroyeur?: {
    agrementNumber?: InputProps["nativeInputProps"];
    department?: InputProps["nativeInputProps"];
  };
  vhuAgrementDemolisseur?: {
    agrementNumber?: InputProps["nativeInputProps"];
    department?: InputProps["nativeInputProps"];
  };
  vhuEcoOrganismes?: InputProps["nativeInputProps"];
  workerCertification?: {
    hasSubSectionThree?: InputProps["nativeInputProps"];
    hasSubSectionFour?: InputProps["nativeInputProps"];
    certificationNumber?: InputProps["nativeInputProps"];
    validityLimit?: InputProps["nativeInputProps"];
    organisation?: SelectProps<
      typeof WORKER_AGREMENT_ORGANISATION_OPTIONS
    >["nativeSelectProps"];
  };
  ecoOrganismePartnersIds?: {
    onChange: (values: string[]) => void;
    value: string[];
    nativeInputProps?: InputProps["nativeInputProps"];
  };
  ecoOrganismeAgreements?: {
    value: (index: number) => InputProps["nativeInputProps"];
    push: (v: string) => void;
    remove: (index: number) => void;
  };
};

export type CompanyTypeInputErrors = {
  transporterReceipt?: {
    receiptNumber?: string;
    validityLimit?: string;
    department?: string;
  };
  brokerReceipt?: {
    receiptNumber?: string;
    validityLimit?: string;
    department?: string;
  };
  traderReceipt?: {
    receiptNumber?: string;
    validityLimit?: string;
    department?: string;
  };
  workerCertification?: {
    certificationNumber?: string;
    validityLimit?: string;
    organisation?: string;
  };
  vhuEcoOrganismes?: string[];
  ecoOrganismeAgreements?: (string | null)[];
  ecoOrganismePartnersIds?: string;
};

type CompanyTypeFormProps = {
  // Valeurs contrôlées du formulaire qui conditionne l'affichage de certains éléments.
  inputValues: CompanyTypeInputValues;
  // Props qui peuvent être passées aux différents champs pour les contrôler via
  // React Hook Form ou Formik.
  inputProps?: CompanyTypeInputProps;
  // Erreurs sur les champs du formulaire.
  inputErrors?: CompanyTypeInputErrors;
  // Gère les événements de sélection ou dé-selection d'une checkbox représentant
  // ou type ou sous-type d'établissement.
  handleToggle: (
    parentValue: AllCompanyType | undefined,
    value: AllCompanyType,
    checked: boolean
  ) => void;
};

/**
 * Ce composant gère l'affichage du formulaire permettant de sélectionner
 * les types et sous type d'entreprise ainsi que les certifications
 * corresponsantes (récépissés, agréments, etc). Il doit être controlé
 * au niveau du composant parent via React Hook Form (voir <RhfCompanyTypeForm />)
 * ou Formik (voir <FormikCompanyTypeForm />).
 */
const CompanyTypeForm = ({
  inputValues,
  inputProps,
  inputErrors,
  handleToggle
}: CompanyTypeFormProps): React.JSX.Element => {
  return (
    <div className="company-type-form">
      {COMPANY_TYPE_OPTIONS.map(option => {
        return (
          <CompanyTypeCheckbox
            key={option.value}
            value={option.value}
            label={option.label}
            helpText={option.helpText}
            inputValues={inputValues}
            handleToggle={handleToggle}
            subTypeOptions={option.subTypes}
            inputProps={inputProps}
            inputErrors={inputErrors}
          />
        );
      })}
    </div>
  );
};

export default React.memo(CompanyTypeForm);
