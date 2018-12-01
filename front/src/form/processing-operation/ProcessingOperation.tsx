import { FieldProps } from "formik";
import React, { useState } from "react";
import Elimination from "./operations-elimination.json";
import Valorisation from "./operations-valorisation.json";
import "./ProcessingOperation.scss";

const Operations: { code: string; description: string }[] = Elimination.concat(
  Valorisation
);

export default function ProcessingOperation(props: FieldProps) {
  const [operation, setOperation] = useState("");

  const operationDetail = Operations.find(o => o.code === operation);

  return (
    <div className="ProcessingOperation">
      <div className="text-quote">
        <p>
          Vous hésitez sur le type d'opération à choisir ? Vous pouvez consulter
          la liste de traitement des déchets sur{" "}
          <a href="https://www.legifrance.gouv.fr/affichTexteArticle.do;jsessionid=DF38C3AD1F5E2888AF25D80D0A703E13.tpdila11v_3?idArticle=LEGIARTI000026902174&cidTexte=LEGITEXT000026918330&dateTexte=20160111">
            le site legifrance.
          </a>
        </p>
      </div>

      <label>Opération de traitement prévue:</label>
      <select
        id="select"
        name={props.field.name}
        onChange={e => {
          setOperation(e.target.value);
          props.form.handleChange(e);
        }}
      >
        <option>Choisissez...</option>
        {Operations.map(o => (
          <option key={o.code} value={o.code}>
            {o.code} - {o.description.substr(0, 50)}
            {o.description.length > 50 ? "..." : ""}
          </option>
        ))}
      </select>

      {operationDetail != null && (
        <div className="notification success">
          Vous avez sélectionné l'opération suivante:{" "}
          <em>{operationDetail.description}</em>
        </div>
      )}
    </div>
  );
}
