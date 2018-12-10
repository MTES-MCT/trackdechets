import React from "react";
import CompanySelector from "./company/CompanySelector";
import { Field } from "formik";
import DateInput from "./custom-inputs/DateInput";

export default function Transporter() {
  return (
    <React.Fragment>
      <h4>Transporteur</h4>
      <CompanySelector name="transporter.company" />

      <h4>Autorisations</h4>
      <div className="form__group">
        <label>
          Numéro de récépissé:
          <Field type="text" name="transporter.receipt" />
        </label>

        <label>
          Département:
          <Field type="text" name="transporter.department" placeholder="Ex: 83" />
        </label>

        <label>
          Limite de validité
          <Field component={DateInput} name="transporter.validityLimit" />
        </label>

        <label>
          Personne à contacter:
          <Field type="text" name="transporter.contact" placeholder="NOM Prénom" />
        </label>

        <label>
          Immatriculation:
          <Field type="text" name="transporter.numberPlate" placeholder="Plaque d'immatriculation du véhicule" />
        </label>
      </div>
    </React.Fragment>
  );
}
