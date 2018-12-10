import React, { useState } from "react";
import WasteCode from "./waste-code/WasteCode";
import { Field, FieldArray, connect } from "formik";
import { wasteCodeValidator } from "./waste-code/waste-code.validator";
import RadioButton from "./radio-button/RadioButton";

const packagings = [
  { value: "BENNE", label: "Benne" },
  { value: "CITERNE", label: "Citerne" },
  { value: "GRV", label: "GRV" },
  { value: "FUT", label: "Fût" },
  { value: "AUTRE", label: "Autre (à préciser)" }
];

type Values = {
  wasteDetails: { code: string; packagings: string[] };
};
export default connect<{}, Values>(function WasteInfo(props) {
  const values = props.formik.values;

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
        <FieldArray
          name="wasteDetails.packagings"
          render={arrayHelpers => (
            <fieldset>
              {packagings.map(p => (
                <label className="label-inline" key={p.value}>
                  <input
                    type="checkbox"
                    name="wasteDetails.packagings"
                    value={p.value}
                    checked={
                      values.wasteDetails.packagings.indexOf(p.value) > -1
                    }
                    onChange={e => {
                      if (e.target.checked) arrayHelpers.push(p.value);
                      else {
                        const idx = values.wasteDetails.packagings.indexOf(
                          p.value
                        );
                        arrayHelpers.remove(idx);
                      }
                    }}
                  />
                  {p.label}
                  <br />
                </label>
              ))}
            </fieldset>
          )}
        />

        {values.wasteDetails.packagings.indexOf("AUTRE") > -1 && (
          <label>
            <Field
              name="wasteDetails.otherPackaging"
              type="text"
              placeholder="Détail de l'autre conditionnement"
            />
          </label>
        )}

        <label>
          Nombre de colis
          <Field type="number" name="wasteDetails.numberOfPackages" />
        </label>
      </div>

      <h4>Quantité</h4>
      <div className="form__group">
        <label>
          Quantité
          <Field
            type="number"
            step="0.001"
            name="wasteDetails.quantity"
            placeholder="En tonnes"
          />
        </label>

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
          <div className="form__group">
            <label>
              Code ADR:
              <input type="text" />
            </label>
          </div>
        </div>
      )}
    </React.Fragment>
  );
});
