import React from "react";
import { Field } from "formik";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import Packagings from "form/bsda/components/packagings/Packagings";
import Tooltip from "common/components/Tooltip";
import TagsInput from "form/bsvhu/components/tags-input/TagsInput";
import { BsdaConsistence } from "generated/graphql/types";

export function WasteInfo({ disabled }) {
  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      <h4 className="form__section-heading">Description du déchet</h4>
      <div className="form__row">
        <label>Code déchet</label>
        <Field as="select" name="waste.code" className="td-select">
          <option />
          <option value="15 02 02*">15 02 02*</option>
          <option value="16 01 11*">16 01 11*</option>
          <option value="16 02 12*">16 02 12*</option>
          <option value="17 01 06*">17 01 06*</option>
          <option value="17 02 04*">17 02 04*</option>
          <option value="17 03 01*">17 03 01*</option>
          <option value="17 06 01*">17 06 01*</option>
          <option value="17 06 03*">17 06 03*</option>
          <option value="17 06 05*">17 06 05*</option>
          <option value="17 08 01*">17 08 01*</option>
          <option value="17 09 03*">17 09 03*</option>
        </Field>
      </div>

      <div className="form__row">
        <label>
          Dénomination du déchet
          <Field
            disabled={disabled}
            type="text"
            name="waste.name"
            className="td-input td-input--medium"
          />
        </label>
      </div>

      <div className="form__row">
        <label>
          Code famille
          <Field
            disabled={disabled}
            type="text"
            name="waste.familyCode"
            className="td-input td-input--small"
          />
        </label>
      </div>

      <div className="form__row">
        <label>
          Nom du matériau
          <Field
            disabled={disabled}
            type="text"
            name="waste.materialName"
            className="td-input td-input--medium"
          />
        </label>
      </div>

      <div className="form__row">
        <label>
          Mention au titre des règlements ADR/RID/ADN/IMDG (Optionnel):
          <Field
            disabled={disabled}
            type="text"
            name="waste.adr"
            className="td-input"
          />
        </label>
      </div>

      <h4 className="form__section-heading">Conditionnement</h4>
      <Field disabled={disabled} name="packagings" component={Packagings} />

      <div className="form__row">
        <label>
          Consistance
          <Field
            as="select"
            name="waste.consistence"
            id="id_mode"
            className="td-select td-input--small"
            disabled={disabled}
          >
            <option value={BsdaConsistence.Solide}>Solide</option>
            <option value={BsdaConsistence.Pulverulent}>Pulvérulents</option>
            <option value={BsdaConsistence.Other}>Autre</option>
          </Field>
        </label>
      </div>

      <h4 className="form__section-heading">Quantité</h4>
      <div className="form__row">
        <label>
          Quantité (en tonnes)
          <Field
            disabled={disabled}
            component={NumberInput}
            name="weight.value"
            className="td-input td-input--small"
            min="0"
            step="0.001"
          />
        </label>

        <div className="form__row">
          <label>
            <Field
              disabled={disabled}
              type="checkbox"
              name="weight.isEstimate"
              className="td-checkbox"
            />
            Ce poids est estimé
          </label>
        </div>
      </div>

      <h4 className="form__section-heading">Numéros de scellés</h4>
      <div className="form__row">
        <label>
          Numéros de scellés
          <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> pour valider chacun" />
          <TagsInput name="waste.sealNumbers" disabled={disabled} />
        </label>
      </div>
    </>
  );
}
