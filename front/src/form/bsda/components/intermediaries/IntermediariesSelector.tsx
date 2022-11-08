import { IconClose } from "common/components/Icons";
import CompanySelector from "form/common/components/company/CompanySelector";
import { FieldArray, FieldProps } from "formik";
import { CompanyInput } from "generated/graphql/types";
import React from "react";

const MAX_NB_OF_INTERMEDIARIES = 3;

export function IntermediariesSelector({
  field: { name, value },
}: FieldProps<CompanyInput[]>) {
  return (
    <div>
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            {value.map((_, index) => (
              <div key={`intermediary-${index}`} className="td-input tw-mb-6">
                <h4 className="form__section-heading">
                  Intermédiaire {index + 1}
                </h4>
                <button
                  type="button"
                  className="btn btn--slim btn--small tw-pr-2 tw-pl-2 tw-float-right"
                  onClick={() => arrayHelpers.remove(index)}
                >
                  <IconClose />
                </button>
                <CompanySelector
                  name={`${name}.${index}`}
                  allowForeignCompanies={false}
                  optionalMail={true}
                  skipFavorite={true}
                  optional={true}
                />
                <div className="tw-mt-2">
                  <button
                    className="btn btn--danger tw-mr-1"
                    type="button"
                    onClick={() => {
                      arrayHelpers.remove(index);
                    }}
                  >
                    Supprimer l'intermédiaire
                  </button>
                </div>
              </div>
            ))}
            <div>
              <button
                type="button"
                className="btn btn--outline-primary"
                disabled={value.length === MAX_NB_OF_INTERMEDIARIES}
                onClick={() => {
                  arrayHelpers.insert(value.length, {
                    siret: "",
                    name: "",
                    address: "",
                    contact: "",
                    mail: "",
                    phone: "",
                    vatNumber: "",
                    country: "",
                  });
                }}
              >
                Ajouter un autre type d'intermédiaire
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
