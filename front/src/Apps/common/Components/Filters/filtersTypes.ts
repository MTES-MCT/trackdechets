export enum FilterType {
  input = "input",
  select = "select",
  date = "date",
}

export type Filter = {
  name: string;
  label: string;
  type: FilterType;
  isActive: boolean;
  options?: { value: string; label: string }[];
  isMultiple?: boolean;
};

export interface FiltersProps {
  open?: boolean;
  filters: Filter[][];
  quickFilters: Filter[];
  onApplyFilters: (values: { [key: string]: string }) => void;
}
