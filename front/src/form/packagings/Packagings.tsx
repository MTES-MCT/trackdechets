import Tooltip from "../../common/components/Tooltip";
import { Close } from "common/components/Icons";
import RedErrorMessage from "common/components/RedErrorMessage";
import NumberInput from "form/custom-inputs/NumberInput";
import { Field, FieldArray, FieldProps } from "formik";
import { Packagings as PackagingsEnum } from "generated/graphql/types";
import React, { InputHTMLAttributes, useMemo } from "react";
import "./Packagings.scss";

const PACKAGINGS = [
  { value: PackagingsEnum.Benne, label: "Benne" },
  { value: PackagingsEnum.Citerne, label: "Citerne" },
  { value: PackagingsEnum.Grv, label: "GRV" },
  { value: PackagingsEnum.Fut, label: "Fût" },
  { value: PackagingsEnum.Autre, label: "Autre (à préciser)" },
];

export default function Packagings({
  field: { name, value },
  form: { errors },
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const isAddButtonDisabled = useMemo(() => {
    if (value?.length === 0) {
      return false;
    }

    return value.some(p =>
      [PackagingsEnum.Citerne, PackagingsEnum.Benne].includes(p.type)
    );
  }, [value]);

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
            {value.map((p, idx) => (
              <div
                key={`${idx}-${p.type}`}
                className="tw-border-2 tw-border-gray-400 tw-border-solid tw-rounded-md tw-px-4 tw-py-2 tw-mb-2"
              >
                <div className="tw-flex tw-mb-4 tw-items-end">
                  <div className="tw-w-11/12 tw-flex">
                    <div className="tw-w-1/3 tw-pr-2">
                      <label>
                        Type
                        <Field
                          name={`${name}.${idx}.type`}
                          as="select"
                          className="td-select"
                        >
                          {PACKAGINGS.map(packaging => (
                            <option
                              key={packaging.value}
                              value={packaging.value}
                              disabled={
                                value?.length > 1 &&
                                ([
                                  PackagingsEnum.Citerne,
                                  PackagingsEnum.Benne,
                                ].includes(packaging.value) ||
                                  value.some(p =>
                                    [
                                      PackagingsEnum.Citerne,
                                      PackagingsEnum.Benne,
                                      ...(packaging.value !==
                                      PackagingsEnum.Autre
                                        ? [packaging.value]
                                        : []),
                                    ].includes(p.type)
                                  ))
                              }
                            >
                              {packaging.label}
                            </option>
                          ))}
                        </Field>
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
                        placeholder="Nombre de colis"
                        min="1"
                        {...([
                          PackagingsEnum.Citerne,
                          PackagingsEnum.Benne,
                        ].includes(p.type) && { max: 1 })}
                      />
                    </div>
                  </div>
                  <div
                    className="tw-px-2"
                    onClick={() => arrayHelpers.remove(idx)}
                  >
                    <button type="button">
                      <Close color="#000" />
                    </button>
                  </div>
                </div>
                <RedErrorMessage name={`${name}.${idx}.type`} />
                <RedErrorMessage name={`${name}.${idx}.other`} />
                <RedErrorMessage name={`${name}.${idx}.quantity`} />
              </div>
            ))}
            <button
              type="button"
              className="btn btn--outline-primary"
              disabled={isAddButtonDisabled}
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
        <div className="tw-mt-4">
          Total : {value.reduce((prev, cur) => prev + cur.quantity, 0)} colis -{" "}
          {value
            .map(v => {
              const packaging = PACKAGINGS.find(p => p.value === v.type);
              return `${v.quantity} ${packaging?.label}(s)`;
            })
            .join(", ")}
        </div>
      )}
    </div>
  );
}
