import { FieldSwitch, RedErrorMessage } from "common/components";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, useFormikContext } from "formik";
import { Bsff, BsffType } from "generated/graphql/types";
import { BSFF_WASTES } from "generated/constants";
import React, { useEffect } from "react";
import Packagings from "./components/packagings/Packagings";
import { PreviousPackagingsPicker } from "./components/PreviousPackagingsPicker";

export default function WasteInfo({ disabled }) {
  const { setFieldValue, values } =
    useFormikContext<Bsff & { previousPackagings: Bsff[] }>();

  const [hasPreviousPackagingsChanged, setHasPreviousPackagingsChanged] =
    React.useState(false);

  useEffect(() => {
    if ([BsffType.Reexpedition, BsffType.Groupement].includes(values.type)) {
      if (!values.id || hasPreviousPackagingsChanged) {
        setFieldValue("packagings", values.previousPackagings);
      }
    }
  }, [
    values.previousPackagings,
    values.type,
    values.id,
    hasPreviousPackagingsChanged,
    setFieldValue,
  ]);

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

      {[
        BsffType.Reconditionnement,
        BsffType.Groupement,
        BsffType.Reexpedition,
      ].includes(values.type) && (
        <>
          <h4 className="form__section-heading">
            Contenants à{" "}
            {values.type === BsffType.Groupement
              ? "grouper"
              : values.type === BsffType.Reexpedition
              ? "reéxpédier"
              : "reconditionner"}
          </h4>
          <PreviousPackagingsPicker
            bsff={values}
            onAddOrRemove={() => setHasPreviousPackagingsChanged(true)}
          />
        </>
      )}

      <h4 className="form__section-heading">Déchet</h4>

      <div className="form__row">
        <label>
          Code déchet
          <Field as="select" name="waste.code" className="td-select">
            <option />
            {BSFF_WASTES.map(item => (
              <option value={item.code} key={item.code}>
                {item.code} - {item.description}
              </option>
            ))}
          </Field>
        </label>
        <RedErrorMessage name="waste.code" />
      </div>

      <div className="form__row">
        <label>
          Dénomination usuelle du déchet
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
          Quantité totale (en kg)
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
