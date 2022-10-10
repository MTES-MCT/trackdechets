import * as React from "react";
import { useQuery } from "@apollo/client";
import { FieldArray, useField } from "formik";
import {
  Bsff,
  BsffStatus,
  BsffType,
  Query,
  QueryBsffsArgs,
} from "generated/graphql/types";
import { GET_PREVIOUS_BSFFS } from "../utils/queries";
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

export function PreviousBsffsPicker({
  bsff,
  onAddOrRemove,
}: PreviousBsffsPickerProps) {
  const code_in = Object.values(OPERATION)
    .filter(operation => operation.successors.includes(bsff.type))
    .map(operation => operation.code);

  const columns: Column<Bsff>[] = React.useMemo(
    () => [
      {
        id: "id",
        Header: "Numéro BSFF",
        accessor: bsff => bsff.id,
        canFilter: true,
        filter: "text",
      },
      {
        id: "packagingsNumero",
        Header: "Numéro(s) de contenant(s)",
        accessor: bsff =>
          bsff.packagings
            ?.map(p => p.numero)
            .filter(n => n?.length > 0)
            .splice(0, 10)
            ?.join(" | "),
        canFilter: true,
        filter: "text",
      },
      {
        id: "wasteCode",
        Header: "Déchet",
        accessor: bsff =>
          `${bsff.waste?.code} - Nature : ${
            bsff.waste?.description ?? "inconnue"
          }`,
        canFilter: true,
        filter: "text",
      },
      {
        id: "emitter",
        Header: "Émetteur initial",
        accessor: bsff =>
          `${bsff.emitter?.company?.name} (${bsff.emitter?.company?.siret})`,
        canFilter: true,
        filter: "text",
      },
    ],
    []
  );

  const instruction =
    bsff.type === BsffType.Groupement
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'un groupement."
      : bsff.type === BsffType.Reconditionnement
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'un reconditionnement."
      : bsff.type === BsffType.Reexpedition
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'une réexpédition."
      : "";

  const { data, loading } = useQuery<Pick<Query, "bsffs">, QueryBsffsArgs>(
    GET_PREVIOUS_BSFFS,
    {
      variables: {
        where: {
          status: { _eq: BsffStatus.IntermediatelyProcessed },
          destination: {
            company: {
              siret: { _eq: bsff.emitter?.company?.siret },
            },
            operation: {
              code: { _in: code_in },
            },
          },
        },
        // pagination does not play well with bsff picking
        first: 5000,
      },
      // make sure we have fresh data here
      fetchPolicy: "cache-and-network",
      skip: !bsff.emitter?.company?.siret?.length,
    }
  );
  const [{ value: previousBsffs }] = useField<Bsff[]>("previousBsffs");

  if (loading) {
    return <Loader />;
  }

  if (data) {
    // remove bsffs that have already been grouped, forwarded or repackaged
    const pickableBsffs = data.bsffs.edges
      .map(({ node: bsff }) => bsff)
      .filter(initialBsff => {
        if (initialBsff.groupedIn && initialBsff.groupedIn.id !== bsff.id) {
          return false;
        }
        if (
          initialBsff.repackagedIn &&
          initialBsff.repackagedIn.id !== bsff.id
        ) {
          return false;
        }
        if (initialBsff.forwardedIn && initialBsff.forwardedIn.id !== bsff.id) {
          return false;
        }
        return true;
      });

    if (!pickableBsffs?.length) {
      return (
        <div>
          {`Aucun BSFF éligible pour ${
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
          name="previousBsffs"
          render={({ push, remove }) => (
            <BsffTable
              columns={columns}
              data={pickableBsffs}
              selected={previousBsffs}
              push={bsff => {
                push(bsff);
                onAddOrRemove();
              }}
              remove={idx => {
                remove(idx);
                onAddOrRemove();
              }}
              bsffType={bsff.type}
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

type BsffTableProps = {
  columns: Column<Bsff>[];
  data: Bsff[];
  selected: Bsff[];
  push: (bsff: Bsff) => void;
  remove: (idx: number) => void;
  bsffType: BsffType;
};

function BsffTable({
  columns,
  data,
  selected,
  push,
  remove,
  bsffType,
}: BsffTableProps) {
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
          const previousBsffIndex = selected.findIndex(
            previousBsff => previousBsff.id === row.values["id"]
          );
          const isSelected = previousBsffIndex >= 0;
          return (
            <TableRow
              {...row.getRowProps()}
              onClick={() => {
                if (isSelected) {
                  remove(previousBsffIndex);
                } else {
                  if (
                    bsffType === BsffType.Reexpedition &&
                    selected.length >= 1
                  ) {
                    window.alert(
                      `Vous ne pouvez sélectionner qu'un seul BSFF initial dans le cadre d'une réexpédition`
                    );
                    return;
                  }
                  const bsff = data.find(bsff => bsff.id === row.values["id"])!;
                  push(bsff);
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
