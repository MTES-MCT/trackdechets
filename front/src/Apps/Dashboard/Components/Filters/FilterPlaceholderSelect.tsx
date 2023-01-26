import {
  filter_type_select_label,
  filter_type_select_placeholder,
} from "assets/wordings/dashboard/wordingsDashboard";
import React from "react";
import { Filter } from "./filtersTypes";

interface FilterPlaceholderSelectProps {
  filters: Filter[];
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  value?: string;
}

const FilterPlaceholderSelect = ({
  filters,
  onChange,
  disabled = false,
  value = "",
}: FilterPlaceholderSelectProps) => {
  return (
    <div className="fr-select-group">
      <label className="fr-label" htmlFor={`${value}_select`}>
        {filter_type_select_label}
      </label>
      <select
        id={`${value}_select`}
        className="fr-select"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="" disabled hidden>
          {filter_type_select_placeholder}
        </option>
        {filters.map(filter => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterPlaceholderSelect;
