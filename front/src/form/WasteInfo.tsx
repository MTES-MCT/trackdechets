import React from "react";
import WasteCode from "./waste-code/WasteCode";
import { Field, FieldArray, connect } from "formik";
import { wasteCodeValidator } from "./waste-code/waste-code.validator";
import RadioButton from "./custom-inputs/RadioButton";
import NumberInput from "./custom-inputs/NumberInput";
import Packagings from "./packagings/Packagings";
import RedErrorMessage from "./RedErrorMessage";
import FormsSelector from "./appendix/FormsSelector";
import AppendixInfo from "./appendix/AppendixInfo";

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
    <React.Fragment>
      <h4>Description du déchet</h4>
      <div className="form__group">
        <Field
          component={WasteCode}
          name="wasteDetails.code"
          validate={wasteCodeValidator}
        />
      </div>

      <div className="text-quote">
        <p>
          L'appellation du déchet est propre à votre entreprise pour vous aider
          à retrouver facilement le déchet concerné.
        </p>
      </div>

      <div className="form__group">
        <label>
          Appellation du déchet
          <Field type="text" name="wasteDetails.name" />
        </label>

        <RedErrorMessage name="wasteDetails.name" />
      </div>

      {values.emitter.type === "APPENDIX1" && <AppendixInfo />}

      {values.emitter.type === "APPENDIX2" && (
        <FormsSelector
          emitterSiret={values.emitter.company.siret}
          name="appendix2Forms"
        />
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

        <Field
          component={NumberInput}
          name="wasteDetails.numberOfPackages"
          label="Nombre de colis"
        />
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
        </fieldset>

        <RedErrorMessage name="wasteDetails.consistence" />
      </div>

      <h4>Quantité</h4>
      <div className="form__group">
        <Field
          component={NumberInput}
          name="wasteDetails.quantity"
          placeholder="En tonnes"
          step="0.001"
        />

        <RedErrorMessage name="wasteDetails.quantity" />

        <fieldset>
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
      {values.wasteDetails.code.includes("*") && (
        <div className="form__group">
          <label>
            Code ADR
            <Field type="text" name="wasteDetails.onuCode" />
          </label>
        </div>
      )}
    </React.Fragment>
  );
});
