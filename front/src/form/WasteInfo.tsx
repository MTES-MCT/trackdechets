import React from "react";
import WasteCode from "./waste-code/WasteCode";
import { Field, connect } from "formik";
import { wasteCodeValidator } from "./waste-code/waste-code.validator";
import { RadioButton } from "./custom-inputs/RadioButton";
import NumberInput from "./custom-inputs/NumberInput";
import Packagings from "./packagings/Packagings";
import RedErrorMessage from "../common/RedErrorMessage";
import FormsSelector from "./appendix/FormsSelector";
import AppendixInfo from "./appendix/AppendixInfo";
import Tooltip from "../common/Tooltip";
import "./WasteInfo.scss";
import { isDangerous } from "../generated/constants";

type Values = {
  wasteDetails: { code: string; packagings: string[] };
  emitter: { company: { siret: string }; type: string };
};
export default connect<{}, Values>(function WasteInfo(props) {
  const values = props.formik.values;

  if (!values.wasteDetails.packagings) {
    values.wasteDetails.packagings = [];
  }

  return (
    <>
      <h4>Description du déchet</h4>
      <div className="form__group">
        <WasteCode name="wasteDetails.code" validate={wasteCodeValidator} />
      </div>

      <div className="form__group">
        <label>
          Votre appellation du déchet (optionnel)
          <Tooltip
            msg="L'appellation du déchet est propre à votre entreprise pour vous aider
          à retrouver facilement le déchet concerné."
          />
          <Field type="text" name="wasteDetails.name" />
        </label>

        <RedErrorMessage name="wasteDetails.name" />
      </div>

      {values.emitter.type === "APPENDIX1" && <AppendixInfo />}

      {values.emitter.type === "APPENDIX2" && (
        <FormsSelector name="appendix2Forms" />
      )}

      <h4>Conditionnement</h4>
      <div className="form__group">
        <Field name="wasteDetails.packagings" component={Packagings} />

        {values.wasteDetails.packagings.indexOf("AUTRE") > -1 && (
          <label>
            <Field
              name="wasteDetails.otherPackaging"
              type="text"
              placeholder="Détail de l'autre conditionnement"
            />
          </label>
        )}

        <label className="mt-2">
          Nombre de colis
          <Field
            component={NumberInput}
            className="waste-details__number-of-packages"
            name="wasteDetails.numberOfPackages"
            min="1"
          />
        </label>
        <RedErrorMessage name="wasteDetails.numberOfPackages" />
      </div>

      <div className="form__group">
        <fieldset>
          <legend>Consistance</legend>
          <Field
            name="wasteDetails.consistence"
            id="SOLID"
            label="Solide"
            component={RadioButton}
          />
          <Field
            name="wasteDetails.consistence"
            id="LIQUID"
            label="Liquide"
            component={RadioButton}
          />
          <Field
            name="wasteDetails.consistence"
            id="GASEOUS"
            label="Gazeux"
            component={RadioButton}
          />
        </fieldset>

        <RedErrorMessage name="wasteDetails.consistence" />
      </div>

      <h4>Quantité en tonnes</h4>
      <div className="form__group">
        <label>
          Quantité
          <Field
            component={NumberInput}
            name="wasteDetails.quantity"
            className="waste-details__quantity"
            placeholder="En tonnes"
            min="0"
            step="0.001"
          />
        </label>
        <RedErrorMessage name="wasteDetails.quantity" />

        <fieldset className="mt-3">
          <legend>Cette quantité est</legend>
          <Field
            name="wasteDetails.quantityType"
            id="REAL"
            label="Réelle"
            component={RadioButton}
          />
          <Field
            name="wasteDetails.quantityType"
            id="ESTIMATED"
            label="Estimée"
            component={RadioButton}
          />
        </fieldset>

        <RedErrorMessage name="wasteDetails.quantityType" />
      </div>
      <div className="form__group">
        <label>
          Mentions au titre des règlements ADR, RID, ADNR, IMDG{" "}
          {!isDangerous(values.wasteDetails.code) && "(optionnel)"}
          <Field type="text" name="wasteDetails.onuCode" />
        </label>

        <RedErrorMessage name="wasteDetails.onuCode" />
      </div>
    </>
  );
});
