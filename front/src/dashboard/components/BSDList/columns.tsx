import * as React from "react";
import {
  ColumnWithLooseAccessor,
  Renderer,
  FilterProps,
  CellProps,
} from "react-table";
import { Bsd, Bsdasri, Bsda, Form, Bsvhu } from "generated/graphql/types";
import { BSDTypeFilter } from "./BSDTypeFilter";
import { TextInputFilter } from "./TextInputFilter";
import * as bsdd from "./BSDD";
import * as bsdasri from "./BSDasri";
import * as bsvhu from "./BSVhu";
import * as bsda from "./BSDa";

// This object declares the mapping between a column id
// and its corresponding filter or order parameter name
// e.g the "type" column filters "types" but is ordered by "type"
//
// it's also used to restrict the type of "Column" to make sure that
// we don't accidentaly add filterable and sortable columns
// that don't have an equivalent in the API
export const COLUMNS_PARAMETERS_NAME = {
  type: {
    filter: "types",
    order: "type",
  },
  readableId: {
    filter: "readableId",
    order: "readableId",
  },
  emitter: {
    filter: "emitter",
    order: "emitter",
  },
  recipient: {
    filter: "recipient",
    order: "recipient",
  },
  waste: {
    filter: "waste",
    order: "waste",
  },
};

export type Column<T extends object = Bsd> = ColumnWithLooseAccessor<T> &
  (
    | {
        id: keyof typeof COLUMNS_PARAMETERS_NAME;
        Filter: Renderer<FilterProps<T>>;
        filter: string;
      }
    | { id: string; disableFilters: true; disableSortBy: true }
  );

export function createColumn(column: Column): Column {
  return {
    ...column,

    accessor: bsd => {
      if (bsd.__typename === "Form") {
        return bsdd.COLUMNS[column.id]?.accessor?.(bsd);
      }
      if (bsd.__typename === "Bsdasri") {
        return bsdasri.COLUMNS[column.id]?.accessor?.(bsd);
      }
      if (bsd.__typename === "Bsvhu") {
        return bsvhu.COLUMNS[column.id]?.accessor?.(bsd);
      }
      if (bsd.__typename === "Bsda") {
        return bsda.COLUMNS[column.id]?.accessor?.(bsd);
      }
      throw new Error(
        `The bsd with type "${bsd.__typename}" has no accessor for the column "${column.id}"`
      );
    },
    Cell: props => {
      if (props.row.original.__typename === "Form") {
        const Cell = bsdd.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<Form>)} />;
        }
      }
      if (props.row.original.__typename === "Bsdasri") {
        const Cell = bsdasri.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<Bsdasri>)} />;
        }
      }
      if (props.row.original.__typename === "Bsvhu") {
        const Cell = bsvhu.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<Bsvhu>)} />;
        }
      }
      if (props.row.original.__typename === "Bsda") {
        const Cell = bsda.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<Bsda>)} />;
        }
      }
      return props.value;
    },
  };
}

export const COLUMNS: Record<string, Column> = {
  type: createColumn({
    id: "type",
    Header: "Type",
    Filter: BSDTypeFilter,
    filter: "text",
  }),
  readableId: createColumn({
    id: "readableId",
    Header: "Numéro",
    Filter: TextInputFilter,
    filter: "text",
  }),
  emitter: createColumn({
    id: "emitter",
    Header: "Émetteur",
    Filter: TextInputFilter,
    filter: "text",
  }),
  recipient: createColumn({
    id: "recipient",
    Header: "Destinataire",
    Filter: TextInputFilter,
    filter: "text",
  }),
  waste: createColumn({
    id: "waste",
    Header: "Déchet",
    Filter: TextInputFilter,
    filter: "text",
  }),
  transporterCustomInfo: createColumn({
    id: "transporterCustomInfo",
    Header: "Champ libre",
    disableFilters: true,
    disableSortBy: true,
  }),
  transporterNumberPlate: createColumn({
    id: "transporterNumberPlate",
    Header: "Plaque immat.",
    disableFilters: true,
    disableSortBy: true,
  }),
  status: createColumn({
    id: "status",
    Header: "Status",
    disableFilters: true,
    disableSortBy: true,
  }),
};
