import * as React from "react";
import {
  ColumnWithLooseAccessor,
  Renderer,
  FilterProps,
  CellProps,
} from "react-table";
import { Bsd } from "generated/graphql/types";
import { BSDTypeFilter } from "./BSDTypeFilter";
import { TextInputFilter } from "./TextInputFilter";
import * as bsdd from "./BSDD";

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

const TYPENAME_COLUMNS = {
  Form: bsdd.COLUMNS,
};

export function createColumn(column: Column): Column {
  return {
    ...column,
    accessor: (bsd, ...args) => {
      const accessor = TYPENAME_COLUMNS[bsd.__typename!]?.[column.id]?.accessor;

      if (accessor == null) {
        throw new Error(
          `The bsd with type "${bsd.__typename}" has no accessor for the column "${column.id}"`
        );
      }

      return accessor(bsd, ...args);
    },
    Cell: props => {
      const Cell = TYPENAME_COLUMNS[props.row.original.__typename!][column.id]
        .Cell as React.ComponentType<CellProps<Bsd>> | undefined;
      return Cell ? <Cell {...props} /> : props.value;
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
