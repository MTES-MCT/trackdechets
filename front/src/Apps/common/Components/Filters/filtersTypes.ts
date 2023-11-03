import { ChangeEvent } from "react";

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
  placeholder?: string;
};

type OnApplyFiltersFn = (values: { [key: string]: string | string[] }) => void;

export interface FiltersProps {
  areAdvancedFiltersOpen?: boolean;
  onApplyFilters: OnApplyFiltersFn;
}

export interface AdvancedFiltersProps {
  open?: boolean;
  filters: Filter[][];
  onApplyFilters: OnApplyFiltersFn;
}

export interface QuickFiltersProp {
  filters: Filter[];
  onApplyFilters: OnApplyFiltersFn;
}

export interface QuickFilterProps {
  label: string;
  placeholder?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}
