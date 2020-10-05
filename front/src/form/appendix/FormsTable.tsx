import { useQuery } from "@apollo/react-hooks";
import { useFormikContext } from "formik";
import gql from "graphql-tag";
import { DateTime } from "luxon";
import React from "react";
import { InlineError } from "src/common/components/Error";
import {
  Form,
  Query,
  QueryAppendixFormsArgs,
} from "src/generated/graphql/types";

const GET_APPENDIX_FORMS = gql`
  query AppendixForms($siret: String!, $wasteCode: String) {
    appendixForms(siret: $siret, wasteCode: $wasteCode) {
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
  const { loading, error, data } = useQuery<
    Pick<Query, "appendixForms">,
    QueryAppendixFormsArgs
  >(GET_APPENDIX_FORMS, {
    variables: {
      wasteCode,
      siret: values.emitter?.company?.siret as string,
    },
    skip: !values.emitter?.company?.siret,
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <InlineError apolloError={error} />;
  if (!data) return <p>Aucune donnée à afficher</p>;

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
              {form.wasteDetails?.code} - {form.wasteDetails?.name}
            </td>
            <td>{form.emitter?.company?.name}</td>
            <td>{DateTime.fromISO(form.receivedAt).toLocaleString()}</td>
            <td>{form.quantityReceived} tonnes</td>
            <td>{form.processingOperationDone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
