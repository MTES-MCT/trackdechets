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
import { FormColumnActions } from "./FormColumnActions";

const ACTIONS_COMPONENTS = {
  [FormType.Form]: FormColumnActions,
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
    accessor: searchResult => searchResult.status,
  },
  {
    id: "actions",
    Header: () => null,
    Cell: ({ row: { original: searchResult } }) => {
      const Component = ACTIONS_COMPONENTS[searchResult.type];
      return <Component searchResult={searchResult} />;
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
