import React from "react";
import { useQuery, gql } from "@apollo/client";
import { useFormikContext } from "formik";
import { InlineError } from "common/components/Error";
import {
  Bsdasri,
  Query,
  QueryBsdasrisArgs,
  BsdasriStatus,
  ProcessingOperationTypes,
} from "generated/graphql/types";
import { formatDate } from "common/datetime";
const GET_GROUPABLE_BSDASRIS = gql`
  query Bsdasris($where: BsdasriWhere) {
    bsdasris(where: $where) {
      edges {
        node {
          id
          emitter {
            company {
              name
            }
          }
          emission {
            wasteCode
          }
          reception {
            receivedAt
            wasteDetails {
              volume
            }
          }
          operation {
            processingOperation
          }
        }
      }
    }
  }
`;

export default function BsdasriTable({
  selectedItems,
  onToggle,
  regroupedInDB,
}) {
  const { values } = useFormikContext<
    Bsdasri & { dbRegroupedBsdasris: string[] }
  >();

  const { loading, error, data } = useQuery<
    Pick<Query, "bsdasris">,
    QueryBsdasrisArgs
  >(GET_GROUPABLE_BSDASRIS, {
    variables: {
      where: {
        _or: [{ groupable: true }, { id_in: regroupedInDB }],

        processingOperation: [
          ProcessingOperationTypes.D12,
          ProcessingOperationTypes.R12,
        ],

        status: BsdasriStatus.Processed,
        recipient: {
          company: { siret: values.emitter?.company?.siret as string },
        },
      },
    },
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <InlineError apolloError={error} />;
  if (!data) return <p>Aucune donnée à afficher</p>;

  const bsdasris = data.bsdasris?.edges;

  if (!bsdasris.length) {
    return (
      <div className="notification notification--error">
        Vous n'avez actuellement aucun bordereau qui peut être inclus dans ce
        groupement.
      </div>
    );
  }
  return (
    <table className="td-table">
      <thead>
        <tr className="td-table__head-tr">
          <th>
            <input
              type="checkbox"
              className="td-checkbox"
              checked={selectedItems.length === bsdasris.length}
              onChange={e =>
                onToggle(
                  e.target.checked ? bsdasris.map(edge => edge.node) : []
                )
              }
            />
          </th>
          <th>Numéro</th>
          <th>Code déchet</th>
          <th>Producteur</th>
          <th>Date de réception</th>
          <th>Quantité</th>
          <th>Opération réalisée</th>
        </tr>
      </thead>
      <tbody>
        {bsdasris.map(edge => (
          <tr
            key={edge.node.id}
            onClick={() => onToggle(edge.node)}
            className="td-table__tr"
          >
            <td>
              <input
                type="checkbox"
                className="td-checkbox"
                checked={selectedItems.indexOf(edge.node.id) > -1}
                onChange={() => true}
              />
            </td>
            <td>{edge.node.id}</td>

            <td>{edge.node.emission?.wasteCode}</td>
            <td>{edge.node.emitter?.company?.name}</td>
            <td>
              {!!edge.node.reception?.receivedAt &&
                formatDate(edge.node.reception?.receivedAt)}
            </td>
            <td>{edge.node.reception?.wasteDetails?.volume}</td>
            <td>{edge.node.operation?.processingOperation}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
