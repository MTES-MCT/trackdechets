import { FieldProps } from "formik";
import React from "react";
import { PROCESSING_OPERATIONS } from "../../generated/constants";
import "./ProcessingOperation.scss";

export default function ProcessingOperation({
  field: { value, name, onChange },
}: FieldProps) {
  const operationDetail = PROCESSING_OPERATIONS.find(
    operation => operation.code === value
  );

  return (
    <div className="ProcessingOperation">
      <div className="text-quote">
        <p>
          Vous hésitez sur le type d'opération à choisir ? Vous pouvez consulter
          la liste de traitement des déchets sur{" "}
          <a
            href="https://www.legifrance.gouv.fr/affichTexteArticle.do;jsessionid=DF38C3AD1F5E2888AF25D80D0A703E13.tpdila11v_3?idArticle=LEGIARTI000026902174&cidTexte=LEGITEXT000026918330&dateTexte=20160111"
            target="_blank"
            rel="noopener noreferrer"
          >
            le site legifrance.
          </a>
        </p>
      </div>

      <label>Opération d’élimination / valorisation prévue (code D/R)</label>
      <select id="select" name={name} value={value} onChange={onChange}>
        <option value="">Choisissez...</option>
        {PROCESSING_OPERATIONS.map(operation => (
          <option key={operation.code} value={operation.code}>
            {operation.code} - {operation.description.substr(0, 120)}
            {operation.description.length > 120 ? "..." : ""}
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
