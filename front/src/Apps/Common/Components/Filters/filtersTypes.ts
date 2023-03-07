import { BsdWhere } from "generated/graphql/types";

export enum FilterType {
  input = "input",
  select = "select",
}

export type Filter = {
  where: (v: any) => BsdWhere;
  value: string;
  label: string;
  order: string;
  type: FilterType;
  isActive: boolean;
  options?: { value: string; label: string }[];
  isMultiple?: boolean;
};

export interface FiltersProps {
  filters: Filter[];
  onApplyFilters: (values: { [key: string]: string }) => void;
}
