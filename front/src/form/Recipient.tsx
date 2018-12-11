import React from "react";
import CompanySelector from "./company/CompanySelector";
import ProcessingOperation from "./processing-operation/ProcessingOperation";
import "./Recipient.scss";
import { Field } from "formik";

export default function Recipient() {
  return (
    <React.Fragment>
      <h4>Entreprise de destination</h4>

      <div className="text-quote recipient">
        <p>
          Pour vous assurer que l'entreprise de destination est autorisée à
          recevoir le déchet, vous pouvez consulter{" "}
          <a href="http://www.installationsclassees.developpement-durable.gouv.fr/rechercheICForm.php">
            la liste des installation classées.
          </a>
        </p>
      </div>

      <CompanySelector name="recipient.company" />

      <h4>Informations complémentaires</h4>

      <div className="form__group">
        <Field component={ProcessingOperation} name="recipient.processingOperation" />
      </div>

      <div className="form__group">
        <label>
          Numéro de CAP (le cas échéant)
          <Field type="text" name="recipient.cap" />
        </label>
      </div>
    </React.Fragment>
  );
}
