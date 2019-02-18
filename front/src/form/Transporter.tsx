import React from "react";
import CompanySelector from "./company/CompanySelector";
import { Field } from "formik";
import DateInput from "./custom-inputs/DateInput";
import RedErrorMessage from "./RedErrorMessage";

export default function Transporter() {
  return (
    <React.Fragment>
      <h4>Transporteur</h4>
      <Field component={CompanySelector} name="transporter.company" />

      <h4>Autorisations</h4>
      <div className="form__group">
        <label>
          Numéro de récépissé
          <Field type="text" name="transporter.receipt" />
        </label>

        <RedErrorMessage name="transporter.receipt" />

        <label>
          Département
          <Field type="text" name="transporter.department" placeholder="Ex: 83" />
        </label>

        <RedErrorMessage name="transporter.department" />

        <label>
          Limite de validité
          <Field component={DateInput} name="transporter.validityLimit" />
        </label>

        <RedErrorMessage name="transporter.validityLimit" />

        <label>
          Immatriculation
          <Field type="text" name="transporter.numberPlate" placeholder="Plaque d'immatriculation du véhicule" />
        </label>

        <RedErrorMessage name="transporter.numberPlate" />
      </div>
    </React.Fragment>
  );
}
