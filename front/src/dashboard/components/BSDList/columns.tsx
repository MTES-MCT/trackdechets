import * as React from "react";
import {
  ColumnWithLooseAccessor,
  Renderer,
  FilterProps,
  CellProps,
} from "react-table";
import { CommonBsd, CommonBsdType } from "generated/graphql/types";
import { BSDTypeFilter } from "./BSDTypeFilter";
import { TextInputFilter } from "./TextInputFilter";
import * as bsdd from "./BSDD/index";
import * as bsdasri from "./BSDasri/index";
import * as bsvhu from "./BSVhu/index";
import * as bsff from "./BSFF/index";
import * as bsda from "./BSDa/index";

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
    order: "emitterCompanyName",
  },
  recipient: {
    filter: "recipient",
    order: "destinationCompanyName",
  },
  transporterNumberPlate: {
    filter: "transporterNumberPlate",
    order: "transporterNumberPlate",
  },
  transporterCustomInfo: {
    filter: "transporterCustomInfo",
    order: "transporterCustomInfo",
  },
  waste: {
    filter: "waste",
    order: "wasteCode",
  },
};

export type Column<T extends object = CommonBsd> = ColumnWithLooseAccessor<T> &
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
      if (bsd.type === CommonBsdType.Bsdd) {
        return bsdd.COLUMNS[column.id]?.accessor?.(bsd);
      }
      if (bsd.type === CommonBsdType.Bsdasri) {
        return bsdasri.COLUMNS[column.id]?.accessor?.(bsd);
      }

      if (bsd.type === CommonBsdType.Bsvhu) {
        return bsvhu.COLUMNS[column.id]?.accessor?.(bsd);
      }
      if (bsd.type === CommonBsdType.Bsff) {
        return bsff.COLUMNS[column.id]?.accessor?.(bsd);
      }
      if (bsd.type === CommonBsdType.Bsda) {
        return bsda.COLUMNS[column.id]?.accessor?.(bsd);
      }
      throw new Error(
        `The bsd with type "${bsd.type}" has no accessor for the column "${column.id}"`
      );
    },
    Cell: props => {
      if (props.row.original.type === CommonBsdType.Bsdd) {
        const Cell = bsdd.COLUMNS[column.id]?.Cell;

        if (Cell) {
          return <Cell {...(props as CellProps<CommonBsd>)} />;
        }
      }
      if (props.row.original.type === CommonBsdType.Bsdasri) {
        const Cell = bsdasri.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<CommonBsd>)} />;
        }
      }
      if (props.row.original.type === CommonBsdType.Bsvhu) {
        const Cell = bsvhu.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<CommonBsd>)} />;
        }
      }
      if (props.row.original.type === CommonBsdType.Bsff) {
        const Cell = bsff.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<CommonBsd>)} />;
        }
      }

      if (props.row.original.type === CommonBsdType.Bsda) {
        const Cell = bsda.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<CommonBsd>)} />;
        }
      }
      return props.value;
    },
  };
}

export const BSD_COLUMNS: Record<string, Column> = {
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
    filter: "text",
    Filter: TextInputFilter,
  }),
  transporterNumberPlate: createColumn({
    id: "transporterNumberPlate",
    Header: "Plaque immat.",
    filter: "text",
    Filter: TextInputFilter,
  }),
  status: createColumn({
    id: "status",
    Header: "Statut",
    disableFilters: true,
    disableSortBy: true,
  }),
};
