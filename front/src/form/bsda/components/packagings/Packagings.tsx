import { IconClose } from "common/components/Icons";
import RedErrorMessage from "common/components/RedErrorMessage";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, FieldArray, FieldProps, useFormikContext } from "formik";
import { BsdaPackaging, BsdaPackagingType } from "generated/graphql/types";
import React, { InputHTMLAttributes } from "react";
import "./Packagings.scss";

export const PACKAGINGS_NAMES = {
  [BsdaPackagingType.BigBag]: "Big-bag",
  [BsdaPackagingType.DepotBag]: "Dépôt-bag",
  [BsdaPackagingType.PaletteFilme]: "Palette filmée",
  [BsdaPackagingType.SacRenforce]: "Sac renforcé",
  [BsdaPackagingType.ConteneurBag]: "Conteneur-bag",
  [BsdaPackagingType.Other]: "Autre(s)",
};

export default function Packagings({
  field: { name, value },
  disabled,
}: FieldProps<BsdaPackaging[] | null> & InputHTMLAttributes<HTMLInputElement>) {
  const { setFieldValue } = useFormikContext();

  if (!value) {
    return null;
  }

  return (
    <div>
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
                      <div className="tw-w-1/3 tw-pr-2">
                        <label>
                          Type
                          <select
                            name={fieldName}
                            className="td-select"
                            value={p.type}
                            onChange={event => {
                              setFieldValue(fieldName, {
                                type: event.target.value,
                                other:
                                  event.target.value === BsdaPackagingType.Other
                                    ? p.other
                                    : "",
                                quantity: p.quantity,
                              });
                            }}
                          >
                            {(Object.entries(PACKAGINGS_NAMES) as Array<
                              [keyof typeof PACKAGINGS_NAMES, string]
                            >).map(([optionValue, optionLabel]) => (
                              <option key={optionValue} value={optionValue}>
                                {optionLabel}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="tw-w-1/3 tw-px-2">
                        {p.type === "OTHER" && (
                          <label>
                            Précisez
                            <Field
                              className="td-input"
                              name={`${name}.${idx}.other`}
                              placeholder="..."
                            />
                          </label>
                        )}
                      </div>
                      <div className="tw-w-1/3 tw-px-2">
                        <Field
                          label="Colis"
                          component={NumberInput}
                          className="td-input"
                          name={`${name}.${idx}.quantity`}
                          placeholder="Nombre"
                          min="1"
                        />
                      </div>
                    </div>
                    <div
                      className="tw-px-2"
                      onClick={() => arrayHelpers.remove(idx)}
                    >
                      <button type="button">
                        <IconClose />
                      </button>
                    </div>
                  </div>
                  <RedErrorMessage name={`${name}.${idx}.type`} />
                  <RedErrorMessage name={`${name}.${idx}.other`} />
                  <RedErrorMessage name={`${name}.${idx}.quantity`} />
                </div>
              );
            })}
            <button
              type="button"
              className="btn btn--outline-primary"
              disabled={disabled}
              onClick={() =>
                arrayHelpers.push({
                  type: BsdaPackagingType.Other,
                  other: "",
                  quantity: 1,
                })
              }
            >
              Ajouter un conditionnement
            </button>
          </div>
        )}
      />
    </div>
  );
}
