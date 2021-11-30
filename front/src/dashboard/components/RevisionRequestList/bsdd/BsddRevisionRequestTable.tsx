import React from "react";
import { BsddRevisionRequest } from "generated/graphql/types";
import { useTable, useFilters, useSortBy } from "react-table";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "common/components";
import { BsddApproveRevision } from "./approve";

type Props = {
  revisions: BsddRevisionRequest[];
};

const STATUS_LABELS = {
  PENDING: "En attente de validation",
  APPROVED: "Approuvée",
  REFUSED: "Refusée",
  CANCELLED: "Annulée",
};

const COLUMNS = [
  {
    Header: "Bordereau",
    accessor: "bsdd.readableId",
  },
  {
    Header: "Demandeur",
    accessor: row => `${row.author.name} (${row.author.siret})`,
  },
  {
    Header: "Statut",
    accessor: row => STATUS_LABELS[row.status],
  },
  {
    Header: "Actions",
    accessor: () => null,
    Cell: ({ row }) => <BsddApproveRevision review={row.original} />,
  },
];

export function BsddRevisionRequestTable({ revisions }: Props) {
  const columns: any = React.useMemo(() => COLUMNS, []);

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
