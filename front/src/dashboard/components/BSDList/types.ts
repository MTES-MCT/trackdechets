import * as React from "react";
import { Form } from "generated/graphql/types";

type AccessorValue = string | number;

export interface Column {
  id: string;
  Header: string;
  accessor: (form: Form) => AccessorValue;
  sortable: boolean;
  filterable: boolean;
  Cell?: React.ComponentType<{ value: AccessorValue; row: Form }>;
}
