import React from "react";
import { useTable, Column } from "react-table";
import { FormSearchResult, FormType } from "generated/graphql/types";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "common/components";
import { FormColumnStatus, FormColumnActions } from "./Form";

const FORM_TYPES = {
  [FormType.Form]: {
    Status: FormColumnStatus,
    Actions: FormColumnActions,
  },
};

const COLUMNS: Array<Column<FormSearchResult>> = [
  {
    id: "readableId",
    Header: "Numéro",
    accessor: searchResult => searchResult.readableId,
  },
  {
    id: "emitter",
    Header: "Émetteur",
    accessor: searchResult => searchResult.emitter,
  },
  {
    id: "recipient",
    Header: "Destinataire",
    accessor: searchResult => searchResult.recipient,
  },
  {
    id: "waste",
    Header: "Déchet",
    accessor: searchResult => searchResult.waste,
  },
  {
    id: "date",
    Header: "Date",
    accessor: searchResult => "TODO",
  },
  {
    id: "status",
    Header: "Statut",
    Cell: ({ row: { original: searchResult } }) => {
      const { Status } = FORM_TYPES[searchResult.type];
      return <Status searchResult={searchResult} />;
    },
  },
  {
    id: "actions",
    Header: () => null,
    Cell: ({ row: { original: searchResult } }) => {
      const { Actions } = FORM_TYPES[searchResult.type];
      return <Actions searchResult={searchResult} />;
    },
  },
];

interface FormSearchResultTableProps {
  searchResults: FormSearchResult[];
}

export function FormSearchResultTable({
  searchResults,
}: FormSearchResultTableProps) {
  const {
    getTableProps,
    headerGroups,
    getTableBodyProps,
    rows,
    prepareRow,
  } = useTable({
    columns: COLUMNS,
    data: searchResults,
  });

  // TODO: pagination
  // TODO: filters
  // TODO: sort by

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
              {row.cells.map(cell => (
                <TableCell {...cell.getCellProps()}>
                  {cell.render("Cell")}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
