import React from "react";
import { useTable, Column } from "react-table";
import classNames from "classnames";
import { FormSearchResult, FormType } from "generated/graphql/types";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "common/components";
import { IconLayout2, IconLayoutModule1 } from "common/components/Icons";
import { FormColumnStatus, FormColumnActions } from "./Form";

const DISPLAY_MODE_KEY = "display_mode";

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

// TODO: split this component in two (table and cards)
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

  const [displayMode, setDisplayMode] = React.useState<"TABLE" | "CARDS">(
    () => {
      // FIXME: not cross-environment proof (e.g SSR)
      // FIXME: the app would crash if localStorage doesn't work
      const preferredDisplayMode = window.localStorage.getItem(
        DISPLAY_MODE_KEY
      );
      return preferredDisplayMode &&
        ["TABLE", "CARDS"].includes(preferredDisplayMode)
        ? (preferredDisplayMode as "TABLE" | "CARDS")
        : "TABLE";
    }
  );

  React.useEffect(() => {
    // FIXME: the app would throw an error if localStorage doesn't work
    window.localStorage.setItem(DISPLAY_MODE_KEY, displayMode);
  }, [displayMode]);

  // TODO: pagination
  // TODO: filters
  // TODO: sort by

  return (
    <>
      <div style={{ margin: "1rem" }}>
        <button
          type="button"
          className={classNames("btn btn--small btn--left", {
            "btn--primary": displayMode === "TABLE",
            "btn--outline-primary": displayMode === "CARDS",
          })}
          onClick={() => setDisplayMode("TABLE")}
        >
          <IconLayout2
            color={displayMode === "CARDS" ? "blueLight" : "white"}
            size="16px"
          />{" "}
          <span>Tableau</span>
        </button>
        <button
          type="button"
          className={classNames("btn btn--small btn--right", {
            "btn--primary": displayMode === "CARDS",
            "btn--outline-primary": displayMode === "TABLE",
          })}
          onClick={() => setDisplayMode("CARDS")}
        >
          <IconLayoutModule1
            color={displayMode === "TABLE" ? "blueLight" : "white"}
            size="16px"
          />{" "}
          <span>Cartes</span>
        </button>
      </div>
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
    </>
  );
}
