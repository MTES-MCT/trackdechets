import React, { useMemo } from "react";
import { FormRevisionRequest } from "generated/graphql/types";
import { useTable, useFilters, useSortBy } from "react-table";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "common/components";
import { BsddRevisionAction } from "./approve/BsddRevisionAction";

type Props = {
  revisions: FormRevisionRequest[];
};

const STATUS_LABELS = {
  PENDING: "En attente de validation",
  ACCEPTED: "Approuvée",
  REFUSED: "Refusée",
  CANCELLED: "Annulée",
};

const COLUMNS = [
  {
    Header: "Bordereau",
    accessor: "form.readableId",
  },
  {
    Header: "Demandeur",
    accessor: row =>
      `${row.authoringCompany.name} (${row.authoringCompany.siret})`,
  },
  {
    Header: "Statut",
    accessor: row => STATUS_LABELS[row.status],
  },
  {
    Header: "Actions",
    accessor: () => null,
    Cell: ({ row }) => <BsddRevisionAction review={row.original} />,
  },
];

export function BsddRevisionRequestTable({ revisions }: Props) {
  const columns: any = useMemo(() => COLUMNS, []);

  const {
    getTableProps,
    headerGroups,
    getTableBodyProps,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: revisions,
      manualFilters: true,
      manualSortBy: true,
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
