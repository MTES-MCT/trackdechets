import { FieldArray, FieldProps } from "formik";
import React, { InputHTMLAttributes } from "react";
import Tooltip from "../common/components/Tooltip";
import styles from "./CompanyType.module.scss";
import { COMPANY_CONSTANTS } from "../Apps/Companies/common/utils";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";

interface CompanyTypeFieldProps {
  handleChange(e, arrayHelpers, companyType, value): void;
}

export default function CompanyTypeField({
  field: { name, value },
  id,
  label,
  handleChange,
  subfields,
  ...props
}: FieldProps & {
  label: string;
  subfields?: object;
} & InputHTMLAttributes<HTMLInputElement> &
  CompanyTypeFieldProps) {
  return (
    <FieldArray
      name={name}
      render={arrayHelpers => (
        <>
          <div className="fr-grid-row fr-mb-2w">
            <span className="fr-text">Profil</span>
          </div>
          <div className="fr-container-fluid">
            {COMPANY_CONSTANTS.map((companyType, idx) => (
              <div key={idx}>
                <div
                  className="fr-grid-row fr-grid-row--gutters"
                  key={companyType.value}
                >
                  <div className="fr-col-11">
                    <Checkbox
                      disabled={props.disabled}
                      options={[
                        {
                          label: companyType.label,
                          nativeInputProps: {
                            name: name,
                            defaultChecked: value.includes(companyType.value),
                            onClick: e =>
                              handleChange(e, arrayHelpers, companyType, value)
                          }
                        }
                      ]}
                    />
                  </div>

                  <div className="fr-col-1">
                    <Tooltip msg={companyType.helpText} />
                  </div>
                </div>
                {subfields?.[companyType.value] ? (
                  <div className={styles.subfields}>
                    <div className="fr-grid-row">
                      {subfields?.[companyType.value]}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
    />
  );
}
