import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { useTable, Column } from "react-table";
import { FormSearchResult, FormStatus, Query } from "generated/graphql/types";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "common/components";

const SEARCH_DRAFTS = gql`
  query SearchDrafts($siret: String!, $status: [String!]!) {
    searchForms(siret: $siret, status: $status) {
      id
      readableId
      status
      emitter
      recipient
      waste
      sirets
    }
  }
`;

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
];

export default function DraftsTab() {
  const { siret } = useParams<{ siret: string }>();
  const { data } = useQuery<Pick<Query, "searchForms">>(SEARCH_DRAFTS, {
    variables: {
      siret,
      status: [FormStatus.Draft],
    },
  });
  const {
    getTableProps,
    headerGroups,
    getTableBodyProps,
    rows,
    prepareRow,
  } = useTable({
    columns: COLUMNS,
    data: data?.searchForms ?? [],
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
