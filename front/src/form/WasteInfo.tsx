import React, { useState } from "react";
import WasteCode from "./waste-code/WasteCode";
import { Field } from "formik";
import { wasteCodeValidator } from "./waste-code/waste-code.validator";

export default function WasteInfo() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <React.Fragment>
      <h4>Description du déchet</h4>
      <div className="form__group">
        <Field component={WasteCode} name="wasteDetails.wasteCode" validate={wasteCodeValidator} />
      </div>

      <div className="form__group">
        <label>
          Code ADR:
          <input type="text" />
        </label>
      </div>

      <h4>Conditionnement</h4>
      <div className="form__group">
        <fieldset>
          <legend>Conditionnement du déchet:</legend>
          <label className="label-inline">
            <Field
              type="checkbox"
              name="wasteDetails.packaging[0]"
              value="benne"
            />
            Benne
          </label>
          <br />
          <label className="label-inline">
            <Field
              type="checkbox"
              name="wasteDetails.packaging[1]"
              value="citerne"
            />
            Citerne
          </label>
          <br />
          <label className="label-inline">
            <Field
              type="checkbox"
              name="wasteDetails.packaging[2]"
              value="GRV"
            />
            GRV
          </label>
          <br />
          <label htmlFor="checkbox-ananas" className="label-inline">
            <Field
              type="checkbox"
              name="wasteDetails.packaging[3]"
              value="fût"
            />
            Fût
          </label>
          <br />
          <label className="label-inline">
            <Field
              type="checkbox"
              name="wasteDetails.packaging[4]"
              value="other"
              onChange={() => setIsChecked(!isChecked)}
            />
            Autre (à préciser)
          </label>
        </fieldset>

        {isChecked && (
          <label>
            <input type="text" />
          </label>
        )}

        <label>
          Nombre de colis:
          <Field type="number" name="wasteDetails.numberOfPackages" />
        </label>
      </div>

      <h4>Quantité</h4>
      <div className="form__group">
        <label>
          Quantité (en tonnes):
          <Field type="number" step="0.001" name="wasteDetails.quantity" />
        </label>

        <fieldset>
          <legend>Cette quantité est</legend>
          <label className="label-inline">
            <input type="radio" name="wasteDetails.quantityType" value="1" />
            Réelle
          </label>
          <label className="label-inline">
            <input type="radio" name="wasteDetails.quantityType" value="0" />
            Estimée
          </label>
        </fieldset>
      </div>
    </React.Fragment>
  );
}
