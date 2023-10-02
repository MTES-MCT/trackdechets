import Tooltip from "../../../../common/components/Tooltip";
import { IconClose } from "Apps/common/Components/Icons/Icons";
import RedErrorMessage from "common/components/RedErrorMessage";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, FieldArray, FieldProps, useFormikContext } from "formik";
import {
  EmitterType,
  PackagingInfo,
  Packagings as PackagingsEnum,
} from "generated/graphql/types";
import {
  PACKAGINGS_NAMES,
  getPackagingInfosSummary,
} from "form/bsdd/utils/packagings";
import React, { InputHTMLAttributes, useMemo } from "react";
import "./Packagings.scss";

export default function Packagings({
  field: { name, value },
  form,
  id,
  ...props
}: FieldProps<PackagingInfo[] | null> & InputHTMLAttributes<HTMLInputElement>) {
  const { setFieldValue, values } = useFormikContext<{
    emitter: { type: EmitterType | undefined } | undefined;
  }>();
  const isAddButtonDisabled = useMemo(() => {
    if (value == null || value.length === 0) {
      return false;
    }

    return value.some(p =>
      [PackagingsEnum.Citerne, PackagingsEnum.Benne].includes(p.type)
    );
  }, [value]);

  const packagings = Object.entries(PACKAGINGS_NAMES).filter(([key]) => {
    return (
      values.emitter?.type !== EmitterType.Appendix1Producer ||
      key !== PackagingsEnum.Pipeline
    );
  }) as Array<[PackagingsEnum, string]>;

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
                                  event.target.value === PackagingsEnum.Autre
                                    ? p.other
                                    : "",
                                quantity: p.quantity,
                              });
                            }}
                          >
                            {packagings.map(([optionValue, optionLabel]) => (
                              <option
                                key={optionValue}
                                value={optionValue}
                                disabled={
                                  props.disabled ||
                                  (value?.length > 1 &&
                                    ([
                                      PackagingsEnum.Citerne,
                                      PackagingsEnum.Benne,
                                    ].includes(optionValue) ||
                                      value.some(p =>
                                        [
                                          PackagingsEnum.Citerne,
                                          PackagingsEnum.Benne,
                                          ...(optionValue !==
                                          PackagingsEnum.Autre
                                            ? [optionValue]
                                            : []),
                                        ].includes(p.type)
                                      )))
                                }
                              >
                                {optionLabel}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="tw-w-1/3 tw-px-2">
                        {p.type === "AUTRE" && (
                          <label>
                            Précisez
                            <Field
                              className="td-input"
                              name={`${name}.${idx}.other`}
                              placeholder="..."
                              disabled={props.disabled}
                            />
                          </label>
                        )}
                      </div>
                      <div className="tw-w-1/3 tw-px-2">
                        {p.type !== "PIPELINE" && (
                          <Field
                            label={
                              [
                                PackagingsEnum.Citerne,
                                PackagingsEnum.Benne,
                              ].includes(p.type)
                                ? "Quantité"
                                : "Colis"
                            }
                            disabled={props.disabled}
                            component={NumberInput}
                            className="td-input"
                            name={`${name}.${idx}.quantity`}
                            placeholder="Nombre de colis"
                            min="1"
                            max={
                              [
                                PackagingsEnum.Citerne,
                                PackagingsEnum.Benne,
                              ].includes(p.type)
                                ? 2
                                : undefined
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div
                      className="tw-px-2"
                      onClick={() => arrayHelpers.remove(idx)}
                    >
                      <button type="button" disabled={props.disabled}>
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
              disabled={props.disabled || isAddButtonDisabled}
              onClick={() =>
                arrayHelpers.push({
                  type: PackagingsEnum.Autre,
                  other: "",
                  quantity: 1,
                })
              }
            >
              Ajouter un conditionnement
            </button>
            <Tooltip
              msg={`Les règles suivantes s'appliquent:
              - si une benne est présente, aucun autre conditionnement ne peut être ajouté
              - si une citerne est présente, aucun autre conditionnement ne peut être ajouté
              - le nombre de citerne et de benne ne peut pas dépasser 1
              - une seule ligne de conditionnement par type, sauf pour "Autre"`}
            />
          </div>
        )}
      />
      {value?.length > 0 && (
        <div className="tw-mt-4">{getPackagingInfosSummary(value)}</div>
      )}
    </div>
  );
}
