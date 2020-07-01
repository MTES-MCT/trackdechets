import { FieldProps } from "formik";
import React from "react";
import { useProcessingOperations } from "../../hooks";
import "./ProcessingOperation.scss";

export default function ProcessingOperationPicker({
  field: { value, name, onChange },
}: FieldProps) {
  const processingOperations = useProcessingOperations();
  const selectedOperation = processingOperations.find(
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
        {processingOperations.map(operation => (
          <option key={operation.code} value={operation.code}>
            {operation.code} - {operation.description.substr(0, 120)}
            {operation.description.length > 120 ? "..." : ""}
          </option>
        ))}
      </select>

      {selectedOperation && (
        <div className="notification success">
          Vous avez sélectionné l'opération suivante:{" "}
          <em>{selectedOperation.description}</em>
        </div>
      )}
    </div>
  );
}
