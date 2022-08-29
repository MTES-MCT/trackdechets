import { FieldSwitch, RedErrorMessage } from "common/components";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, useFormikContext } from "formik";
import { Bsff } from "generated/graphql/types";
import React, { useEffect } from "react";
import Packagings from "./components/packagings/Packagings";

export default function WasteInfo({ disabled }) {
  const { setFieldValue, values } = useFormikContext<Bsff>();

  useEffect(() => {
    const totalWeight = values.packagings.reduce((acc, p) => {
      return acc + p.weight ?? 0;
    }, 0);
    setFieldValue("weight.value", totalWeight);
  }, [values.packagings, setFieldValue]);

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      <h4 className="form__section-heading">Déchet</h4>

      <div className="form__row">
        <label>
          Code déchet
          <Field type="text" name="waste.code" disabled className="td-input" />
        </label>
        <RedErrorMessage name="waste.code" />
      </div>

      <div className="form__row">
        <label>
          Nature du fluide
          <Field
            type="text"
            name="waste.description"
            disabled={disabled}
            className="td-input"
          />
        </label>
        <RedErrorMessage name="waste.description" />
      </div>

      <div className="form__row">
        <label>
          Mention ADR
          <Field
            type="text"
            name="waste.adr"
            disabled={disabled}
            className="td-input"
          />
        </label>
        <RedErrorMessage name="waste.adr" />
      </div>

      <h4 className="form__section-heading">Contenants</h4>

      <Field name="packagings" component={Packagings} disabled={disabled} />

      <h4 className="form__section-heading">Quantité</h4>

      <div className="form__row">
        <label>
          Poids total en kilos
          <Field
            component={NumberInput}
            name="weight.value"
            disabled={disabled}
            className="td-input"
          />
        </label>
        <Field
          type="checkbox"
          label="Il s'agit d'une estimation"
          component={FieldSwitch}
          name="weight.isEstimate"
          disabled={disabled}
        />
        <RedErrorMessage name="weight.value" />
      </div>
    </>
  );
}
