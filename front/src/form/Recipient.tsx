import React, { useState } from "react";
import CompanySelector from "./company/CompanySelector";
import ProcessingOperation from "./processing-operation/ProcessingOperation";
import "./Recipient.scss";
import { Field, connect } from "formik";
import RedErrorMessage from "./RedErrorMessage";
import DateInput from "./custom-inputs/DateInput";

type Values = {
  trader: { company: { siret: string } };
};

export default connect<{}, Values>(function Recipient({ formik }) {
  const [hasTrader, setHasTrader] = useState(
    formik.values.trader.company.siret != ""
  );
  return (
    <React.Fragment>
      <h4>Entreprise de destination</h4>

      <div className="text-quote recipient">
        <p>
          Pour vous assurer que l'entreprise de destination est autorisée à
          recevoir le déchet, vous pouvez consulter{" "}
          <a
            href="http://www.installationsclassees.developpement-durable.gouv.fr/rechercheICForm.php"
            target="_blank"
          >
            la liste des installation classées.
          </a>
        </p>
      </div>

      <Field component={CompanySelector} name="recipient.company" />

      <h4>Informations complémentaires</h4>

      <div className="form__group">
        <Field
          component={ProcessingOperation}
          name="recipient.processingOperation"
        />

        <RedErrorMessage name="recipient.processingOperation" />
      </div>

      <div className="form__group">
        <label>
          Numéro de CAP (le cas échéant)
          <Field type="text" name="recipient.cap" />
        </label>
      </div>

      <div className="form__group">
        <label>
          <input
            type="checkbox"
            defaultChecked={hasTrader}
            onChange={() => setHasTrader(!hasTrader)}
          />
          Je suis passé par un négociant
        </label>
      </div>
      {hasTrader && (
        <React.Fragment>
          <h4>Négociant</h4>
          <Field component={CompanySelector} name="trader.company" />

          <div className="form__group">
            <label>
              Numéro de récépissé
              <Field type="text" name="trader.receipt" />
            </label>

            <RedErrorMessage name="trader.receipt" />

            <label>
              Département
              <Field
                type="text"
                name="trader.department"
                placeholder="Ex: 83"
              />
            </label>

            <RedErrorMessage name="trader.department" />

            <label>
              Limite de validité
              <Field component={DateInput} name="trader.validityLimit" />
            </label>

            <RedErrorMessage name="trader.validityLimit" />
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
});
