import React from "react";
import { useQuery, gql } from "@apollo/client";
import { useFormikContext } from "formik";
import { InlineError } from "common/components/Error";
import {
  Bsdasri,
  Query,
  QueryBsdasrisArgs,
  BsdasriStatus,
} from "generated/graphql/types";

const GET_ELIGIBLE_BSDASRIS = gql`
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
          transporter {
            transport {
              volume
              packagings {
                type
                other
                quantity
                volume
              }
            }
          }
        }
      }
    }
  }
`;

const aggregatePackagings = packagingsArray => {
  return packagingsArray.reduce((prev, cur) => {
    for (const packaging of cur) {
      const found = prev.find(
        item => item.type === packaging.type && item.other === packaging.other
      );
      if (found) {
        return prev.map(item =>
          item.type === packaging.type && item.other === packaging.other
            ? {
                type: found.type,
                other: found.other,
                quantity: found.quantity + packaging.quantity,
                volume: found.volume + packaging.volume,
              }
            : item
        );
      } else {
        return [...prev, packaging];
      }
    }
    return prev;
  }, []);
};
const RefreshButton = ({ onClick }) => (
  <button
    type="button"
    className="btn btn--small  btn--primary tw-mb-2"
    onClick={() => onClick()}
  >
    Rafraîchir
  </button>
);

const SelectedBsdasrisSummary = ({ selectedItems }) => {
  if (!selectedItems?.length) {
    return null;
  }
  const packagings = selectedItems.map(
    item => item?.transporter?.transport?.packagings ?? []
  );

  const aggregatedPackagings = aggregatePackagings(packagings);
  return (
    <div className="tw-mt-4">
      <p>Contenants</p>
      <table className="td-table" style={{ display: "table-cell" }}>
        <thead>
          <tr>
            <th>Quantité</th>
            <th>Type</th>
            <th>Autre</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {aggregatedPackagings.map(row => (
            <tr key={`${row.type}${row.other}`}>
              <td>{row.quantity}</td>
              <td>{row.type}</td>
              <td>{row.other}</td>
              <td>{row.volume}</td>
            </tr>
          ))}
          <tr>
            <td>
              {aggregatedPackagings.reduce(
                (prev, curr) => prev + curr.quantity,
                0
              )}
            </td>
            <td />
            <td />
            <td>
              {aggregatedPackagings.reduce(
                (prev, curr) => prev + curr.volume * curr.quantity,
                0
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default function BsdasriTableSynthesis({
  selectedItems,
  onToggle,
  regroupedInDB,
  disabled = false,
}) {
  const { values } = useFormikContext<
    Bsdasri & { dbRegroupedBsdasris: string[] }
  >();

  const { loading, error, data, refetch } = useQuery<
    Pick<Query, "bsdasris">,
    QueryBsdasrisArgs
  >(GET_ELIGIBLE_BSDASRIS, {
    variables: {
      where: {
        _or: [
          {
            id: { _in: regroupedInDB },
          },

          {
            status: { _eq: BsdasriStatus.Sent },
            groupable: true,
            transporter: {
              company: {
                siret: { _eq: values.emitter?.company?.siret as string },
              },
            },
          },
        ],
      },
    },
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <InlineError apolloError={error} />;

  const bsdasris = data?.bsdasris?.edges ?? [];

  if (!bsdasris.length) {
    return (
      <div className="notification notification--error">
        Vous n'avez actuellement aucun bordereau qui peut être inclus dans ce
        bordereau de synthèse. <RefreshButton onClick={refetch} />
      </div>
    );
  }
  return (
    <>
      <p className="tw-my-2">
        Tous les bordereaux présentés ci-dessous correspondent à des bordereaux
        dasris que vous avez pris en charge.{" "}
        {!disabled && <RefreshButton onClick={refetch} />}
      </p>

      <table className="td-table">
        <thead>
          <tr className="td-table__head-tr">
            <th>
              <input
                type="checkbox"
                className="td-checkbox"
                disabled={disabled}
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
            <th>Volume (transporteur)</th>
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
                  disabled={disabled}
                  checked={selectedItems.indexOf(edge.node.id) > -1}
                  onChange={() => true}
                />
              </td>
              <td>{edge.node.id}</td>

              <td>{edge.node.waste?.code}</td>
              <td>{edge.node.emitter?.company?.name}</td>

              <td>{edge.node.transporter?.transport?.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <SelectedBsdasrisSummary
        selectedItems={bsdasris
          .map(edge => edge.node)
          .filter(node => selectedItems.includes(node.id))}
      />
    </>
  );
}
