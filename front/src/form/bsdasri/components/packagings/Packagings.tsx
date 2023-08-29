import { IconClose } from "Apps/common/Components/Icons/Icons";
import RedErrorMessage from "common/components/RedErrorMessage";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, FieldArray, FieldProps, useFormikContext } from "formik";
import {
  BsdasriPackaging,
  BsdasriPackagingType,
} from "generated/graphql/types";
import {
  PACKAGINGS_NAMES,
  getDasriPackagingInfosSummary,
} from "form/bsdasri/utils/packagings";
import React, { InputHTMLAttributes } from "react";
import "./Packagings.scss";

export default function DasriPackagings({
  field: { name, value },
  form,
  id,
  disabled,
  summaryHint,
  ...props
}: FieldProps<BsdasriPackaging[] | null> & {
  summaryHint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const { setFieldValue } = useFormikContext();

  if (!value) {
    return null;
  }

  return (
    <div className="tw-mt-2">
      {!value.length && (
        <span>Aucun conditionnement n'est encore défini sur ce bordereau.</span>
      )}
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            {value.map((p, idx) => {
              const fieldName = `${name}.${idx}`;

              return (
                <div
                  key={`${idx}-${p.type}`}
                  className="tw-border-2 tw-border-gray-400 tw-border-solid tw-rounded-md tw-px-4 tw-py-2 tw-mb-2"
                >
                  <div className="tw-flex tw-mb-4 tw-items-end">
                    <div className="tw-w-11/12 tw-flex">
                      <div className="tw-w-1/3 tw-px-2 tw-flex tw-items-end">
                        <Field
                          label="Nombre de colis"
                          component={NumberInput}
                          className="td-input"
                          name={`${name}.${idx}.quantity`}
                          placeholder="Nombre de colis"
                          min="1"
                          disabled={disabled}
                          validate={value => {
                            if (value === null) {
                              return "Champ requis";
                            }
                            if (value < 1) {
                              return "Le nombre de colis doit être supérieur ou égal à 1";
                            }
                          }}
                        />
                        <RedErrorMessage name={`${name}.${idx}.quantity`} />
                      </div>
                      <div className="tw-w-1/3 tw-pr-2 tw-flex tw-items-end">
                        <label>
                          Type
                          <select
                            name={fieldName}
                            className="td-select"
                            value={p.type}
                            disabled={disabled}
                            onChange={event => {
                              setFieldValue(fieldName, {
                                type: event.target.value,
                                other:
                                  event.target.value ===
                                  BsdasriPackagingType.Autre
                                    ? p.other
                                    : "",
                                quantity: p.quantity,
                                volume: p.volume || 0,
                              });
                            }}
                          >
                            {(
                              Object.entries(PACKAGINGS_NAMES) as Array<
                                [keyof typeof PACKAGINGS_NAMES, string]
                              >
                            ).map(([optionValue, optionLabel]) => (
                              <option
                                key={optionValue}
                                value={optionValue}
                                disabled={disabled}
                              >
                                {optionLabel}
                              </option>
                            ))}
                          </select>
                        </label>
                        <RedErrorMessage name={`${name}.${idx}.type`} />
                      </div>
                      <div className="tw-w-1/3 tw-px-2 tw-flex tw-items-end">
                        {p.type === "AUTRE" && (
                          <label>
                            Précisez
                            <Field
                              className="td-input"
                              name={`${name}.${idx}.other`}
                              placeholder="..."
                              disabled={disabled}
                              validate={value => {
                                if (value === null || value === "") {
                                  return "Champ requis";
                                }
                              }}
                            />
                            <RedErrorMessage name={`${name}.${idx}.other`} />
                          </label>
                        )}
                      </div>

                      <div className="tw-w-1/3 tw-px-2 tw-flex tw-items-end">
                        <Field
                          label="Volume unitaire (l)"
                          component={NumberInput}
                          className="td-input"
                          name={`${name}.${idx}.volume`}
                          placeholder="Volume unitaire (l)"
                          min="1"
                          disabled={disabled}
                        />
                        <RedErrorMessage name={`${name}.${idx}.volume`} />
                      </div>
                    </div>
                    {!disabled && (
                      <div
                        className="tw-px-2 tw-mb-2"
                        onClick={() => arrayHelpers.remove(idx)}
                      >
                        <button type="button">
                          <IconClose />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!disabled && (
              <button
                type="button"
                className="btn btn--outline-primary"
                disabled={disabled}
                onClick={() =>
                  arrayHelpers.push({
                    type: BsdasriPackagingType.Autre,
                    other: "",
                    quantity: 1,
                    volume: 1,
                  })
                }
              >
                Ajouter un conditionnement
              </button>
            )}
          </div>
        )}
      />
      {value?.length > 0 && (
        <div className="tw-mt-4">
          <>
            {getDasriPackagingInfosSummary(value)}{" "}
            {!!summaryHint && <span>{summaryHint}</span>}
          </>
        </div>
      )}
    </div>
  );
}
