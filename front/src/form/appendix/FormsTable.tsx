import React from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { useFormikContext } from "formik";
import { Form } from "../model";
import { DateTime } from "luxon";

const GET_APPENDIX_FORMS = gql`
  query AppendixForms($emitterSiret: String!, $wasteCode: String) {
    appendixForms(siret: $emitterSiret, wasteCode: $wasteCode) {
      readableId
      emitter {
        company {
          name
        }
      }
      wasteDetails {
        code
        name
      }
      receivedAt
      quantityReceived
      processingOperationDone
    }
  }
`;

export default function FormsTable({ wasteCode, selectedItems, onToggle }) {
  const { values } = useFormikContext<Form>();
  const { loading, error, data } = useQuery(GET_APPENDIX_FORMS, {
    variables: {
      wasteCode,
      emitterSiret: values.emitter.company.siret
    },
    skip: !values.emitter.company.siret
  });

  if (loading) return <p>Chargement...</p>;
  if (error || !data) return <p>{`Erreur! ${error && error.message}`}</p>;

  const forms = data.appendixForms;

  if (!forms.length) {
    return (
      <div className="notification error">
        Vous n'avez actuellement aucun bordereau qui peut être inclus dans ce
        regroupement.{" "}
        {wasteCode && (
          <span>
            Essayez de vider le filtre sur le code déchet{" "}
            <strong>{wasteCode}</strong> pour identifier des bordereaux
            regroupables
          </span>
        )}
      </div>
    );
  }
  return (
    <table className="table">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selectedItems.length === forms.length}
              onChange={e => onToggle(e.target.checked ? forms : [])}
            />
          </th>
          <th>Numéro</th>
          <th>Code déchet</th>
          <th>Expéditeur initial</th>
          <th>Date de réception</th>
          <th>Quantité</th>
          <th>Opération réalisée</th>
        </tr>
      </thead>
      <tbody>
        {forms.map(form => (
          <tr key={form.readableId} onClick={() => onToggle(form)}>
            <td>
              <input
                type="checkbox"
                checked={selectedItems.indexOf(form.readableId) > -1}
                onChange={() => true}
              />
            </td>
            <td>{form.readableId}</td>
            <td>
              {form.wasteDetails.code} - {form.wasteDetails.name}
            </td>
            <td>{form.emitter.company.name}</td>
            <td>{DateTime.fromISO(form.receivedAt).toLocaleString()}</td>
            <td>{form.quantityReceived} tonnes</td>
            <td>{form.processingOperationDone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
