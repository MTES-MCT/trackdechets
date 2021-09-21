import { IconClose } from "common/components/Icons";
import RedErrorMessage from "common/components/RedErrorMessage";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, FieldArray, FieldProps, useField } from "formik";
import { BsffPackagingInput, BsffType } from "generated/graphql/types";
import React, { InputHTMLAttributes } from "react";
import "./Packagings.scss";

export default function BsffPackagings({
  field: { name, value },
  form,
  id,
  disabled,
  ...props
}: FieldProps<BsffPackagingInput[]> & InputHTMLAttributes<HTMLInputElement>) {
  const [{ value: type }] = useField<BsffType>("type");
  const canEdit =
    !disabled && ![BsffType.Reexpedition, BsffType.Groupement].includes(type);

  return (
    <div className="tw-mt-2">
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            {value.map((p, idx) => {
              const fieldName = `${name}.${idx}`;

              return (
                <div
                  key={idx}
                  className="tw-border-2 tw-border-gray-400 tw-border-solid tw-rounded-md tw-px-4 tw-py-2 tw-mb-2"
                >
                  <div className="tw-flex tw-mb-4 tw-items-end">
                    <div className="tw-w-11/12 tw-flex">
                      <div className="tw-w-1/4 tw-px-2">
                        <label>
                          Dénomination
                          <Field
                            className="td-input"
                            name={`${fieldName}.name`}
                            disabled={!canEdit}
                          />
                        </label>
                      </div>

                      <div className="tw-w-1/4 tw-px-2">
                        <label>
                          Volume
                          <Field
                            component={NumberInput}
                            className="td-input"
                            name={`${fieldName}.volume`}
                            disabled={!canEdit}
                          />
                        </label>
                      </div>

                      <div className="tw-w-1/4 tw-px-2">
                        <label>
                          Numéro
                          <Field
                            className="td-input"
                            name={`${fieldName}.numero`}
                            disabled={!canEdit}
                          />
                        </label>
                      </div>

                      <div className="tw-w-1/4 tw-px-2">
                        <label>
                          Poids en kilos
                          <Field
                            component={NumberInput}
                            className="td-input"
                            name={`${fieldName}.weight`}
                            disabled={!canEdit}
                          />
                        </label>
                      </div>
                    </div>
                    {canEdit && (
                      <div
                        className="tw-px-2"
                        onClick={() => arrayHelpers.remove(idx)}
                      >
                        <button type="button">
                          <IconClose />
                        </button>
                      </div>
                    )}
                  </div>
                  <RedErrorMessage name={`${fieldName}.name`} />
                  <RedErrorMessage name={`${fieldName}.numero`} />
                  <RedErrorMessage name={`${fieldName}.weight`} />
                </div>
              );
            })}
            {canEdit && (
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={() =>
                  arrayHelpers.push({
                    name: "",
                    numero: "",
                    weight: 0,
                  })
                }
              >
                Ajouter un contenant
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
