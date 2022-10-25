import * as React from "react";
import { useQuery } from "@apollo/client";
import { FieldArray, useField } from "formik";
import {
  Bsff,
  BsffPackaging,
  BsffType,
  Query,
  QueryBsffPackagingsArgs,
} from "generated/graphql/types";
import { GET_PREVIOUS_PACKAGINGS } from "../utils/queries";
import {
  Loader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "common/components";
import { OPERATION } from "../utils/constants";
import { useTable, Column, useFilters } from "react-table";

interface PreviousBsffsPickerProps {
  bsff: Bsff;
  onAddOrRemove: () => void;
}

export function PreviousPackagingsPicker({
  bsff,
  onAddOrRemove,
}: PreviousBsffsPickerProps) {
  const code_in = Object.values(OPERATION)
    .filter(operation => operation.successors.includes(bsff.type))
    .map(operation => operation.code);

  const columns: Column<BsffPackaging>[] = React.useMemo(
    () => [
      {
        id: "id",
        Header: "Numéro BSFF",
        accessor: bsffPackaging => bsffPackaging.bsff?.id, // TODO
        canFilter: true,
        filter: "text",
      },
      {
        id: "packagingsNumero",
        Header: "Numéro(s) de contenant(s)",
        accessor: bsffPackaging => bsffPackaging.numero,
        canFilter: true,
        filter: "text",
      },
      {
        id: "wasteCode",
        Header: "Déchet",
        accessor: bsffPackaging =>
          bsffPackaging?.acceptation?.wasteCode ??
          bsffPackaging.bsff?.waste?.code,
        canFilter: true,
        filter: "text",
      },
      {
        id: "emitter",
        Header: "Émetteur initial",
        accessor: bsffPackaging =>
          `${bsffPackaging.bsff?.emitter?.company?.name} (${bsffPackaging.bsff?.emitter?.company?.siret})`,
        canFilter: true,
        filter: "text",
      },
    ],
    []
  );

  const instruction =
    bsff.type === BsffType.Groupement
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'un groupement."
      : bsff.type === BsffType.Reconditionnement
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'un reconditionnement."
      : bsff.type === BsffType.Reexpedition
      ? "Retrouvez ci-dessous la liste des contenants qui sont en attente d'une réexpédition."
      : "";

  const [{ value: previousPackagings }] = useField<BsffPackaging[]>(
    "previousPackagings"
  );

  const { data, loading } = useQuery<
    Pick<Query, "bsffPackagings">,
    QueryBsffPackagingsArgs
  >(GET_PREVIOUS_PACKAGINGS, {
    variables: {
      // pagination does not play well with bsff picking
      first: 5000,
      where: {
        operation: {
          code: { _in: code_in },
        },
        bsff: {
          ...(bsff.type === BsffType.Reexpedition &&
          previousPackagings?.length > 0
            ? { id: { _eq: previousPackagings[0].bsffId } }
            : {}),
          destination: {
            company: {
              siret: { _eq: bsff.emitter?.company?.siret },
            },
          },
        },
      },
    },
    // make sure we have fresh data here
    fetchPolicy: "cache-and-network",
    skip: !bsff.emitter?.company?.siret?.length,
  });

  if (loading) {
    return <Loader />;
  }

  if (data) {
    const pickablePackagings = data.bsffPackagings.edges
      .map(({ node: packaging }) => packaging)
      .filter(packaging => {
        // remove packagings that are grouped, forwarded or repackaged in another BSFF
        if (packaging.nextBsff?.id !== bsff.id) {
          return false;
        }
        // in case of réexpédition, remove packaging that are not on the same BSFF
        if (
          bsff.type === BsffType.Reexpedition &&
          previousPackagings?.length > 0
        ) {
          return packaging.bsffId === previousPackagings[0].bsffId;
        }
        return true;
      });

    if (!pickablePackagings?.length) {
      return (
        <div>
          {`Aucun contenant éligible pour ${
            bsff.type === BsffType.Groupement
              ? "un regroupement"
              : bsff.type === BsffType.Reconditionnement
              ? "un reconditionnement"
              : bsff.type === BsffType.Reexpedition
              ? "une réexpédition"
              : ""
          }
          `}
        </div>
      );
    }

    return (
      <div style={{ padding: "1rem 0" }}>
        <p style={{ marginBottom: "0.25rem" }}>{instruction}</p>
        <FieldArray
          name="previousPackagings"
          render={({ push, remove }) => (
            <BsffPackagingTable
              columns={columns}
              data={pickablePackagings}
              selected={previousPackagings}
              push={bsffPackaging => {
                push(bsffPackaging);
                onAddOrRemove();
              }}
              remove={idx => {
                remove(idx);
                onAddOrRemove();
              }}
            />
          )}
        />
      </div>
    );
  }

  return <div>Aucun établissement émetteur sélectionné</div>;
}

// Define a default UI for filtering
function DefaultColumnFilter({ column: { filterValue, setFilter } }) {
  return (
    <input
      className="td-input td-input--small"
      value={filterValue || ""}
      onChange={e => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`Filtrer...`}
    />
  );
}

type BsffPackagingTableProps = {
  columns: Column<BsffPackaging>[];
  data: BsffPackaging[];
  selected: BsffPackaging[];
  push: (bsffPackaging: BsffPackaging) => void;
  remove: (idx: number) => void;
};

function BsffPackagingTable({
  columns,
  data,
  selected,
  push,
  remove,
}: BsffPackagingTableProps) {
  const filterTypes = React.useMemo(
    () => ({
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .includes(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  );

  const {
    getTableProps,
    headerGroups,
    getTableBodyProps,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      filterTypes,
      defaultColumn,
    },
    useFilters
  );

  return (
    <Table {...getTableProps()}>
      <TableHead>
        {headerGroups.map(headerGroup => (
          <TableRow {...headerGroup.getHeaderGroupProps()}>
            <TableHeaderCell />
            {headerGroup.headers.map(column => (
              <TableHeaderCell {...column.getHeaderProps()}>
                {column.render("Header")}
                <div>{column.canFilter ? column.render("Filter") : null}</div>
              </TableHeaderCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          const previousPackagingIndex = selected.findIndex(
            previousPackaging => previousPackaging.id === row.original.id
          );
          const isSelected = previousPackagingIndex >= 0;
          return (
            <TableRow
              {...row.getRowProps()}
              onClick={() => {
                if (isSelected) {
                  remove(previousPackagingIndex);
                } else {
                  const bsffPackaging = data.find(
                    bsffPackaging => bsffPackaging.id === row.original.id
                  )!;
                  push(bsffPackaging);
                }
              }}
            >
              <TableCell>
                <input
                  type="checkbox"
                  className="td-input"
                  checked={isSelected}
                  readOnly
                />
              </TableCell>
              {row.cells.map(cell => {
                return (
                  <TableCell {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
