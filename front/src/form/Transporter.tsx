import React from "react";
import CompanySelector from "./company/CompanySelector";
import { Field } from "formik";

export default function Transporter() {
  return (
    <React.Fragment>
      <h4>Transporteur</h4>
      <CompanySelector name="transporter.company" />

      <h4>Autorisations</h4>
      <div className="form__group">
        <label>
          Numéro de récépissé:
          <Field type="text" name="transporter.receipt"/>
        </label>

        <label>
         Département:
          <Field type="text" name="transporter.department" />
        </label>

        <label>
          Limite de validité
          <Field type="date" name="transporter.validityLimit" />
        </label>

        <label>
          Personne à contacter:
          <Field type="text" name="transporter.contact" />
        </label>

        <label>
          Immatriculation:
          <Field type="text" name="transporter.numberPlate" />
        </label>
      </div>
    </React.Fragment>
  );
}
