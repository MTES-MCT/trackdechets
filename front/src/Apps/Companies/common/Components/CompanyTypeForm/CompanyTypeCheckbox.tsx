import React, { ReactNode } from "react";
import Tooltip from "../../../../common/Components/Tooltip/Tooltip";
import { AllCompanyType, CompanySubTypeOption } from "../../utils";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import CertificationForm from "./CertificationForm";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps,
  CompanyTypeInputValues
} from "./CompanyTypeForm";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";

type CompanyTypeCheckboxProps = {
  label: string;
  parentValue?: AllCompanyType | undefined;
  value: AllCompanyType;
  helpText?: string;
  subTypeOptions?: CompanySubTypeOption[];
  // Représente un formulaire récépissé, agrément, etc
  certificationForm?: ReactNode;
  handleToggle: (
    parentValue: AllCompanyType | undefined,
    value: AllCompanyType,
    checked: boolean
  ) => void;
  inputProps?: CompanyTypeInputProps;
  inputErrors?: CompanyTypeInputErrors;
  inputValues: CompanyTypeInputValues;
};

const CompanyTypeCheckbox = ({
  label,
  parentValue,
  value,
  helpText,
  handleToggle,
  subTypeOptions,
  inputValues,
  inputProps,
  inputErrors
}: CompanyTypeCheckboxProps): React.JSX.Element => {
  const companyTypeChecked = React.useMemo(() => {
    const fullValue = parentValue ? `${parentValue}.${value}` : value;
    return inputValues.companyTypes.includes(fullValue);
  }, [parentValue, value, inputValues.companyTypes]);

  const showSubTypes = React.useMemo(
    () => companyTypeChecked && Boolean(subTypeOptions),
    [companyTypeChecked, subTypeOptions]
  );

  const labelWithHelp = (
    <>
      <span data-testid={`company-type-label-${label}`}>{label}</span>{" "}
      <Tooltip className="fr-ml-1w" title={helpText} />
    </>
  );

  return (
    <div key={value}>
      <div>
        <div>
          <SingleCheckbox
            options={[
              {
                label: labelWithHelp,
                nativeInputProps: {
                  value: value,
                  checked: companyTypeChecked,
                  onChange: e =>
                    handleToggle(
                      parentValue,
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
                parentValue={value}
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
