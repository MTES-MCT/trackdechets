import { RedErrorMessage, Label } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field } from "formik";
import React from "react";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import Packagings from "./components/packagings/Packagings";
import "./Bsdasri.scss";
import { getInitialEmitterWorkSite } from "./utils/initial-state";
import WorkSite from "form/common/components/work-site/WorkSite";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { BsdasriStatus } from "generated/graphql/types";

export default function Emitter({ status }) {
  const disabled = [
    BsdasriStatus.SignedByProducer,
    BsdasriStatus.Sent,
    BsdasriStatus.Received,
  ].includes(status);

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}
      <CompanySelector
        disabled={disabled}
        name="emitter.company"
        heading="Personne responsable de l'élimination des déchets"
      />
      <WorkSite
        disabled={disabled}
        switchLabel="Je souhaite ajouter une adresse de collecte ou d'enlèvement"
        headingTitle="Adresse d'enlèvement"
        designation="du site d'enlèvement"
        getInitialEmitterWorkSiteFn={getInitialEmitterWorkSite}
      />

      <div className="form__row">
        <Label htmlFor="id_onBehalfOfEcoorganisme">
          <Field
            type="checkbox"
            className="td-checkbox"
            name="emitter.onBehalfOfEcoorganisme"
            id="id_onBehalfOfEcoorganisme"
            required={false}
            disabled={disabled}
          />
          Agit pour le compte de l'éco organisme agréé
        </Label>
        <RedErrorMessage name="emitter.onBehalfOfEcoorganisme" />
      </div>
      <h4 className="form__section-heading">Détail du déchet</h4>
      <div className="form__row">
        <fieldset>
          <legend className="tw-font-semibold">Code déchet</legend>
          <Field
            name="emission.wasteCode"
            id="18 01 03*"
            label="18 01 03* DASRI d'origine humaine"
            component={RadioButton}
            disabled={disabled}
          />
          <Field
            name="emission.wasteCode"
            id="18 01 02*"
            label="18 01 02* DASRI d'origine animale"
            component={RadioButton}
            disabled={disabled}
          />
        </fieldset>
      </div>

      <h4 className="form__section-heading">Conditionnement</h4>

      <Field
        name="emission.wasteDetails.packagingInfos"
        component={Packagings}
        disabled={disabled}
      />

      <h4 className="form__section-heading">Quantité en kg</h4>

      <div className="form__row">
        <label>
          Quantité remise :
          <Field
            component={NumberInput}
            name="emission.wasteDetails.quantity"
            className="td-input dasri__waste-details__quantity"
            disabled={disabled}
            placeholder="En kg"
            min="0"
            step="1"
          />
          <span className="tw-ml-2">kg</span>
        </label>

        <RedErrorMessage name="emission.wasteDetails.quantity" />
      </div>

      <div className="form__row">
        <fieldset>
          <legend className="tw-font-semibold">Cette quantité est</legend>
          <Field
            name="emission.wasteDetails.quantityType"
            id="REAL"
            label="Réélle"
            component={RadioButton}
            disabled={disabled}
          />
          <Field
            name="emission.wasteDetails.quantityType"
            id="ESTIMATED"
            label="Estimée"
            component={RadioButton}
            disabled={disabled}
          />
        </fieldset>
      </div>

      <div className="form__row">
        <label>
          Code ADR
          <Field
            disabled={disabled}
            type="text"
            name="emission.wasteDetails.onuCode"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="emission.wasteDetails.onuCode" />
      </div>

      <div className="form__row">
        <label>
          Champ libre
          <Field
            disabled={disabled}
            component="textarea"
            name="emitter.customInfo"
            className="td-textarea"
          />
        </label>
      </div>

      <div className="form__row">
        <label>
          Date de remise au collecteur transporteur
          <div className="td-date-wrapper">
            <Field
              name="emission.handedOverAt"
              component={DateInput}
              className="td-input"
              disabled={disabled}
            />
          </div>
        </label>
      </div>
    </>
  );
}
