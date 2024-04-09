import React, { useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { useFormikContext } from "formik";
import { InlineError } from "../../../../Apps/common/Components/Error/Error";
import {
  Bsdasri,
  Query,
  QueryBsdasrisArgs,
  BsdasriStatus,
  DestinationOperationCodeTypes,
  BsdasriPackaging
} from "@td/codegen-ui";
import { formatDate } from "../../../../common/datetime";
import { RefreshButton } from "./Common";
import { aggregatePackagings } from "./utils";

const GET_GROUPABLE_BSDASRIS = gql`
  query Bsdasris($where: BsdasriWhere) {
    bsdasris(where: $where) {
      edges {
        node {
          id
          waste {
            code
          }
          emitter {
            company {
              name
            }
          }
          destination {
            reception {
              date
              volume
              packagings {
                type
                other
                quantity
                volume
              }
            }
            operation {
              code
              weight {
                value
              }
            }
          }
        }
      }
    }
  }
`;

export default function BsdasriTableGrouping({
  selectedItems,
  onToggle,
  regroupedInDB
}) {
  const { values, setFieldValue } = useFormikContext<
    Bsdasri & { dbRegroupedBsdasris: string[] }
  >();

  const { loading, error, data, refetch } = useQuery<
    Pick<Query, "bsdasris">,
    QueryBsdasrisArgs
  >(GET_GROUPABLE_BSDASRIS, {
    variables: {
      where: {
        _or: [{ groupable: true }, { id: { _in: regroupedInDB } }],

        destination: {
          company: { siret: { _eq: values.emitter?.company?.siret as string } },
          operation: {
            code: {
              _in: [
                DestinationOperationCodeTypes.D12,
                DestinationOperationCodeTypes.R12
              ]
            }
          }
        },

        status: { _eq: BsdasriStatus.AwaitingGroup }
      }
    }
  });
  // fill weight and packaging fields
  useEffect(() => {
    if (!data) {
      return;
    }
    const bsdasris = data?.bsdasris?.edges ?? [];
    const selectedDasris = bsdasris
      .filter(bsd => selectedItems.indexOf(bsd.node.id) >= 0)
      .map(edge => edge?.node);
    setFieldValue(
      "emitter.emission.weight.value",
      selectedDasris.reduce(
        (prev, cur) => prev + (cur?.destination?.operation?.weight?.value ?? 0),
        0
      ) ?? 0
    );
    // Manually set isEstimate which is usually handled by the weight widget main switch
    setFieldValue(
      "emitter.emission.weight.isEstimate",
      values?.emitter?.emission?.weight?.isEstimate ?? false
    );

    const packagings: BsdasriPackaging[][] = selectedDasris.map(
      item => item?.destination?.reception?.packagings ?? []
    );
    const aggregatedPackagings = aggregatePackagings(packagings);

    setFieldValue("emitter.emission.packagings", aggregatedPackagings);
  }, [selectedItems, data, setFieldValue]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <InlineError apolloError={error} />;
  if (!data) return <p>Aucune donnée à afficher</p>;

  const bsdasris = data.bsdasris?.edges ?? [];

  if (!bsdasris.length) {
    return (
      <div className="notification notification--error">
        Vous n'avez actuellement aucun bordereau qui peut être inclus dans ce
        groupement. <RefreshButton onClick={refetch} />
      </div>
    );
  }

  return (
    <table className="td-table" style={{ tableLayout: "auto" }}>
      <thead>
        <tr className="td-table__head-tr">
          <th>
            <input
              type="checkbox"
              className="td-checkbox tw-mx-2"
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
          <th>Quantité Volume</th>
          <th>Quantité Poids</th>
          <th>Opération réalisée</th>
        </tr>
      </thead>
      <tbody>
        {bsdasris.map(edge => (
          <tr
            key={edge.node.id}
            onClick={() => {
              onToggle(edge.node);
            }}
            className="td-table__tr"
          >
            <td>
              <input
                type="checkbox"
                className="td-checkbox tw-mx-2"
                checked={selectedItems.indexOf(edge.node.id) > -1}
                onChange={() => true}
              />
            </td>
            <td>{edge.node.id}</td>

            <td>{edge.node.waste?.code}</td>
            <td>{edge.node.emitter?.company?.name}</td>
            <td>
              {!!edge.node.destination?.reception?.date &&
                formatDate(edge.node.destination?.reception?.date)}
            </td>
            <td>{edge.node.destination?.reception?.volume}</td>
            <td>{edge.node.destination?.operation?.weight?.value}</td>
            <td>{edge.node.destination?.operation?.code}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
