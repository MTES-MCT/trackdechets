import React, { useMemo } from "react";
import { BsdaRevisionRequest } from "codegen-ui";
import { useTable, useFilters, useSortBy } from "react-table";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell
} from "../../../../common/components";
import { BsdaRevisionAction } from "./approve/BsdaRevisionAction";
import { BsdaRevisionStatus } from "./approve/BsdaRevisionStatus";

type Props = {
  revisions: BsdaRevisionRequest[];
};

const COLUMNS = [
  {
    Header: "Bordereau",
    accessor: "bsda.id"
  },
  {
    Header: "Demandeur",
    accessor: row =>
      `${row.authoringCompany.name} (${row.authoringCompany.siret})`
  },
  {
    Header: "Statut",
    accessor: () => null,
    Cell: ({ row }) => <BsdaRevisionStatus review={row.original} />
  },
  {
    Header: "Actions",
    accessor: () => null,
    Cell: ({ row }) => <BsdaRevisionAction review={row.original} />
  }
];

export function BsdaRevisionRequestTable({ revisions }: Props) {
  const columns: any = useMemo(() => COLUMNS, []);

  const { getTableProps, headerGroups, getTableBodyProps, rows, prepareRow } =
    useTable(
      {
        columns,
        data: revisions,
        manualFilters: true,
        manualSortBy: true
      },
      useFilters,
      useSortBy
    );

  return (
    <Table {...getTableProps()}>
      <TableHead>
        {headerGroups.map(headerGroup => (
          <TableRow {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <TableHeaderCell {...column.getHeaderProps()}>
                {column.render("Header")}
              </TableHeaderCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <TableRow {...row.getRowProps()}>
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
