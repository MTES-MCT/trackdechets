import React from "react";
import WasteCode from "./waste-code/WasteCode";
import { Field, FieldArray, connect } from "formik";
import { wasteCodeValidator } from "./waste-code/waste-code.validator";
import RadioButton from "./custom-inputs/RadioButton";
import NumberInput from "./custom-inputs/NumberInput";
import Packagings from "./packagings/Packagings";

type Values = {
  wasteDetails: { code: string; packagings: string[] };
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
      </div>

      <h4>Quantité</h4>
      <div className="form__group">
        <Field
          component={NumberInput}
          name="wasteDetails.quantity"
          label="Quantitié"
          placeholder="En tonnes"
          step="0.001"
        />

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
