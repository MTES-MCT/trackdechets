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
import { GET_BSFF_FORMS, GET_PREVIOUS_BSFFS } from "../utils/queries";
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
  bsffType: BsffType;
  max?: number;
}

export function PreviousBsffsPicker({
  bsffType,
  max = Infinity,
}: PreviousBsffsPickerProps) {
  const code_in = Object.values(OPERATION)
    .filter(operation => operation.successors.includes(bsffType))
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
    bsffType === BsffType.Groupement
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'un groupement."
      : bsffType === BsffType.Reconditionnement
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'un reconditionnement."
      : bsffType === BsffType.Reexpedition
      ? "Retrouvez ci-dessous la liste des BSFFs qui sont en attente d'une réexpédition."
      : "";

  const { data } = useQuery<Pick<Query, "bsffs">, QueryBsffsArgs>(
    GET_PREVIOUS_BSFFS,
    {
      variables: {
        where: {
          status: { _eq: BsffStatus.IntermediatelyProcessed },
          destination: {
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
    }
  );
  const [{ value: previousBsffs }] = useField<Bsff[]>("previousBsffs");

  if (data == null) {
    return <Loader />;
  }

  // remove bsffs that have already been grouped, forwarded or repackaged
  const pickableBsffs = data.bsffs.edges
    .map(({ node: bsff }) => bsff)
    .filter(bsff => {
      return !bsff.groupedIn && !bsff.repackagedIn && !bsff.forwardedIn;
    });

  if (!pickableBsffs?.length) {
    return (
      <div>
        {`Aucune BSFF éligible pour ${
          bsffType === BsffType.Groupement
            ? "un regroupement"
            : bsffType === BsffType.Reconditionnement
            ? "un reconditionnement"
            : bsffType === BsffType.Reexpedition
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
            push={push}
            remove={remove}
            max={max}
          />
        )}
      />
    </div>
  );
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
  max: number;
};

function BsffTable({
  columns,
  data,
  selected,
  push,
  remove,
  max,
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
                  if (selected.length >= max) {
                    window.alert(
                      `Vous ne pouvez pas sélectionner plus de ${max} BSFFs avec ce type de BSFF.`
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
