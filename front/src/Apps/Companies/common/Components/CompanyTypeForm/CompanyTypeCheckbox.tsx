import React, { ReactNode } from "react";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import TdTooltip from "../../../../../common/components/Tooltip";
import { AllCompanyType, CompanySubTypeOption } from "../../utils";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import CertificationForm from "./CertificationForm";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps,
  CompanyTypeInputValues
} from "./CompanyTypeForm";

type CompanyTypeCheckboxProps = {
  label: string;
  value: AllCompanyType;
  helpText?: string;
  subTypeOptions?: CompanySubTypeOption[];
  // Représente un formulaire récépissé, agrément, etc
  certificationForm?: ReactNode;
  handleToggle: (value: AllCompanyType, checked: boolean) => void;
  inputProps?: CompanyTypeInputProps;
  inputErrors?: CompanyTypeInputErrors;
  inputValues: CompanyTypeInputValues;
};

const CompanyTypeCheckbox = ({
  label,
  value,
  helpText,
  handleToggle,
  subTypeOptions,
  inputValues,
  inputProps,
  inputErrors
}: CompanyTypeCheckboxProps): React.JSX.Element => {
  const companyTypeChecked = React.useMemo(
    () => inputValues.companyTypes.includes(value),
    [value, inputValues.companyTypes]
  );
  const showSubTypes = React.useMemo(
    () => companyTypeChecked && Boolean(subTypeOptions),
    [companyTypeChecked, subTypeOptions]
  );

  const labelWithHelp = (
    <>
      {label} <TdTooltip msg={helpText} />
    </>
  );

  return (
    <div key={value}>
      <div>
        <div>
          <Checkbox
            options={[
              {
                label: labelWithHelp,
                nativeInputProps: {
                  value: value,
                  checked: companyTypeChecked,
                  onChange: e =>
                    handleToggle(
                      e.currentTarget.value as AllCompanyType,
                      e.currentTarget.checked
                    )
                }
              }
            ]}
          />
        </div>
      </div>
      {companyTypeChecked && (
        <CertificationForm
          companyType={value}
          inputProps={inputProps}
          inputValues={inputValues}
          inputErrors={inputErrors}
        />
      )}
      {showSubTypes && (
        <Highlight className="fr-mb-8v">
          {subTypeOptions!.map(subTypeOption => {
            return (
              <CompanyTypeCheckbox
                key={subTypeOption.value}
                value={subTypeOption.value}
                label={subTypeOption.label}
                inputValues={inputValues}
                handleToggle={handleToggle}
                inputProps={inputProps}
                inputErrors={inputErrors}
              />
            );
          })}
        </Highlight>
      )}
    </div>
  );
};

export default React.memo(CompanyTypeCheckbox);
