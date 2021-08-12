import { FieldSwitch, RedErrorMessage } from "common/components";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { Field, useField } from "formik";
import { BsffType } from "generated/graphql/types";
import React from "react";
import Packagings from "./components/packagings/Packagings";

export default function WasteInfo({ disabled }) {
  const [{ value: type }] = useField<BsffType>("type");

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
            name="waste.nature"
            disabled={disabled}
            className="td-input"
          />
        </label>
        <RedErrorMessage name="waste.nature" />
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

      {type === BsffType.Groupement ? (
        <div className="notification warning">
          Le groupement ne permet pas de modifier le(s) contenant(s) des BSFFs à
          grouper. Si vous souhaitez changer de contenant(s), vous devez
          sélectionner un reconditionnement à l'étape "Type de bordereau".
        </div>
      ) : (
        <Field name="packagings" component={Packagings} disabled={disabled} />
      )}

      <h4 className="form__section-heading">Quantité</h4>

      <div className="form__row">
        <label>
          Poids total en kilos
          <Field
            component={NumberInput}
            name="quantity.kilos"
            disabled={disabled}
            className="td-input"
          />
        </label>
        <Field
          type="checkbox"
          label="Il s'agit d'une estimation"
          component={FieldSwitch}
          name="quantity.isEstimate"
          disabled={disabled}
        />
        <RedErrorMessage name="quantity.kilos" />
      </div>
    </>
  );
}
