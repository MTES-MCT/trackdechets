export enum FilterType {
  input = "input",
  select = "select",
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
  filters: Filter[];
  onApplyFilters: (values: { [key: string]: string }) => void;
}
