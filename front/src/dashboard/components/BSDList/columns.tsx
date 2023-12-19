import * as React from "react";
import {
  ColumnWithLooseAccessor,
  Renderer,
  FilterProps,
  CellProps
} from "react-table";
import { Bsd, Bsdasri, Bsda, Form, Bsvhu } from "@td/codegen-ui";
import { BSDTypeFilter } from "./BSDTypeFilter";
import { TextInputFilter } from "./TextInputFilter";
import {
  GET_BSDS_ACTOR_MAX_LENGTH,
  GET_BSDS_READABLE_ID_MAX_LENGTH,
  GET_BSDS_PLATES_MAX_LENGTH,
  GET_BSDS_CUSTOM_INFO_MAX_LENGTH,
  GET_BSDS_WASTE_MAX_LENGTH
} from "shared/constants";
import * as bsdd from "./BSDD";
import * as bsdasri from "./BSDasri";
import * as bsvhu from "./BSVhu";
import * as bsff from "./BSFF";
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
    filter: value => ({ type: { _in: value } }),
    order: "type"
  },
  readableId: {
    filter: value => ({
      _or: [
        { readableId: { _contains: value } },
        { customId: { _contains: value } },
        { packagingNumbers: { _hasSome: value } },
        { packagingNumbers: { _itemContains: value } }
      ]
    }),
    order: "readableId"
  },
  emitter: {
    filter: value => ({
      _or: [
        { emitter: { company: { name: { _match: value } } } },
        { emitter: { company: { siret: { _contains: value } } } },
        { emitter: { pickupSite: { name: { _match: value } } } }
      ]
    }),
    order: "emitterCompanyName"
  },
  recipient: {
    filter: value => ({
      _or: [
        { destination: { company: { name: { _match: value } } } },
        { destination: { company: { siret: { _contains: value } } } }
      ]
    }),
    order: "destinationCompanyName"
  },
  transporterNumberPlate: {
    filter: value => ({
      transporter: { transport: { plates: { _itemContains: value } } }
    }),
    order: "transporterNumberPlate"
  },
  transporterCustomInfo: {
    filter: value => ({ transporter: { customInfo: { _match: value } } }),
    order: "transporterCustomInfo"
  },
  waste: {
    filter: value => ({
      _or: [
        { waste: { code: { _contains: value } } },
        { waste: { description: { _match: value } } }
      ]
    }),
    order: "wasteCode"
  }
};

export type Column<T extends object = Bsd> = ColumnWithLooseAccessor<T> &
  (
    | {
        id: keyof typeof COLUMNS_PARAMETERS_NAME;
        Filter: Renderer<FilterProps<T>>;
        filter: string;
      }
    | {
        id: string;
        disableFilters: true;
        disableSortBy: true;
        filterPlaceHolder?: string;
        filterMaxLength?: number;
      }
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
      if (bsd.__typename === "Bsff") {
        return bsff.COLUMNS[column.id]?.accessor?.(
          bsd as unknown as bsff.BsffFragment
        );
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
      if (props.row.original.__typename === "Bsff") {
        const Cell = bsff.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return (
            <Cell {...(props as unknown as CellProps<bsff.BsffFragment>)} />
          );
        }
      }
      if (props.row.original.__typename === "Bsda") {
        const Cell = bsda.COLUMNS[column.id]?.Cell;
        if (Cell) {
          return <Cell {...(props as CellProps<Bsda>)} />;
        }
      }
      return props.value;
    }
  };
}

export const COLUMNS: Record<string, Column> = {
  type: createColumn({
    id: "type",
    Header: "Type",
    Filter: BSDTypeFilter,
    filter: "text"
  }),
  readableId: createColumn({
    id: "readableId",
    Header: "Numéro",
    Filter: TextInputFilter,
    filter: "text",
    filterPlaceHolder: "N° BSD ou contenant",
    filterMaxLength: GET_BSDS_READABLE_ID_MAX_LENGTH
  }),
  emitter: createColumn({
    id: "emitter",
    Header: "Émetteur",
    Filter: TextInputFilter,
    filter: "text",
    filterMaxLength: GET_BSDS_ACTOR_MAX_LENGTH
  }),
  recipient: createColumn({
    id: "recipient",
    Header: "Destinataire",
    Filter: TextInputFilter,
    filter: "text",
    filterMaxLength: GET_BSDS_ACTOR_MAX_LENGTH
  }),
  waste: createColumn({
    id: "waste",
    Header: "Déchet",
    Filter: TextInputFilter,
    filter: "text",
    filterMaxLength: GET_BSDS_WASTE_MAX_LENGTH
  }),
  transporterCustomInfo: createColumn({
    id: "transporterCustomInfo",
    Header: "Champ libre",
    filter: "text",
    Filter: TextInputFilter,
    filterMaxLength: GET_BSDS_CUSTOM_INFO_MAX_LENGTH
  }),
  transporterNumberPlate: createColumn({
    id: "transporterNumberPlate",
    Header: "Plaque immat.",
    filter: "text",
    Filter: TextInputFilter,
    filterMaxLength: GET_BSDS_PLATES_MAX_LENGTH
  }),
  status: createColumn({
    id: "status",
    Header: "Statut",
    disableFilters: true,
    disableSortBy: true
  })
};
