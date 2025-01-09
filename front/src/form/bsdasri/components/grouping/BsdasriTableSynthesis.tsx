import React from "react";
import { useQuery, gql } from "@apollo/client";
import { useFormikContext } from "formik";
import { InlineError } from "../../../../Apps/common/Components/Error/Error";
import {
  Bsdasri,
  Query,
  QueryBsdasrisArgs,
  BsdasriStatus,
  BsdasriPackaging
} from "@td/codegen-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableRowDigest
} from "../../../../common/components";
import { RefreshButton } from "./Common";
import { aggregatePackagings } from "./utils";
import { verbosePackagings } from "../../../../dashboard/detail/bsdasri/BsdasriDetailContent";

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

const SelectedBsdasrisDigest = ({ selectedItems }) => {
  if (!selectedItems?.length) {
    return null;
  }
  const packagings: BsdasriPackaging[][] = selectedItems.map(
    item => item?.transporter?.transport?.packagings ?? []
  );

  const aggregatedPackagings = aggregatePackagings(packagings);
  return (
    <div className="tw-mt-4">
      <p>Contenants</p>
      <Table style={{ display: "table-cell" }}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{""}</TableHeaderCell>
            <TableHeaderCell>Nombre</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>

            <TableHeaderCell> Volume unitaire (l)</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {aggregatedPackagings.map(row => (
            <TableRow key={`${row.type}${row.other}${row.volume}`}>
              <TableCell>{""}</TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>
                {verbosePackagings[row.type]} {!!row.other && `: ${row.other}`}
              </TableCell>

              <TableCell>{row.volume}</TableCell>
            </TableRow>
          ))}
          <TableRowDigest>
            <TableCell>
              <strong>Total</strong>{" "}
            </TableCell>
            <TableCell>
              {aggregatedPackagings.reduce(
                (prev, curr) => prev + curr.quantity,
                0
              )}
            </TableCell>
            <TableCell>{null}</TableCell>

            <TableCell>
              {aggregatedPackagings.reduce(
                (prev, curr) => prev + curr.volume * curr.quantity,
                0
              )}
            </TableCell>
          </TableRowDigest>
        </TableBody>
      </Table>
    </div>
  );
};

export default function BsdasriTableSynthesis({
  selectedItems,
  onToggle,
  regroupedInDB,
  disabled = false
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
            id: { _in: regroupedInDB }
          },
          {
            status: { _eq: BsdasriStatus.Sent },
            groupable: true,
            transporter: {
              company: {
                siret: { _eq: values.emitter?.company?.siret as string }
              }
            }
          }
        ]
      }
    }
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
  const selectedBsdasris = bsdasris
    .map(edge => edge.node)
    .filter(node => selectedItems.includes(node.id));

  const wasteCodes = new Set(selectedBsdasris.map(bsd => bsd.waste?.code));

  return (
    <>
      <p className="tw-my-2">
        Tous les bordereaux présentés ci-dessous correspondent à des bordereaux
        dasris que vous avez pris en charge.{" "}
        {!disabled && <RefreshButton onClick={refetch} />}
      </p>
      {!wasteCodes?.has(values?.waste?.code) && !!wasteCodes?.size && (
        <p className="tw-mb-2 tw-text-red-700">
          Les bordereaux sélectionnés ne portent pas le code déchet choisi.
        </p>
      )}
      {wasteCodes?.size > 1 && (
        <p className="tw-mb-2 tw-text-red-700">
          Vous avez sélectionné des bordereaux avec des codes déchets
          différents.
        </p>
      )}
      <Table isSelectable>
        <TableHead>
          <TableRow>
            <TableHeaderCell>
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
            </TableHeaderCell>
            <TableHeaderCell>Numéro</TableHeaderCell>
            <TableHeaderCell>Code déchet</TableHeaderCell>
            <TableHeaderCell>Producteur</TableHeaderCell>
            <TableHeaderCell>Volume (transporteur)</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bsdasris.map(edge => (
            <TableRow
              key={edge.node.id}
              onClick={() => onToggle(edge.node)}
              className="td-table__tr"
            >
              <TableCell>
                <input
                  type="checkbox"
                  className="td-checkbox"
                  disabled={disabled}
                  checked={selectedItems.indexOf(edge.node.id) > -1}
                  onChange={() => true}
                />
              </TableCell>
              <TableCell>{edge.node.id}</TableCell>

              <TableCell>{edge.node.waste?.code}</TableCell>
              <TableCell>{edge.node.emitter?.company?.name}</TableCell>

              <TableCell>{edge.node.transporter?.transport?.volume}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <SelectedBsdasrisDigest selectedItems={selectedBsdasris} />
    </>
  );
}
