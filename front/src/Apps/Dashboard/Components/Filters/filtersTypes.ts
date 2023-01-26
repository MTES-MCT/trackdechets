export enum FilterType {
  input = "input",
  select = "select",
}

export type Filter = {
  value: string;
  label: string;
  type: FilterType;
  options?: { value: string; label: string }[];
  isMultiple?: boolean;
};

export interface FiltersProps {
  filters: Filter[];
}
