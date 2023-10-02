import React from "react";
import {
  filter_type_select_label,
  filter_type_select_placeholder,
} from "../../wordings/dashboard/wordingsDashboard";
import { Filter } from "./filtersTypes";

interface FilterSelectorProps {
  filters: Filter[][];
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  value?: string;
}

const FilterSelector = ({
  filters,
  onChange,
  disabled = false,
  value = "",
}: FilterSelectorProps) => {
  const filtersList = filters.map((filtersGroup, index) => {
    let filtersElement = filtersGroup.map(filter => (
      <option key={filter.name} value={filter.name} disabled={!filter.isActive}>
        {filter.label}
      </option>
    ));

    if (index !== filters.length - 1) {
      filtersElement.push(
        <option key="separator" disabled>
          ──────────
        </option>
      );
    }

    return filtersElement;
  });

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
        <option value="" disabled>
          {filter_type_select_placeholder}
        </option>

        {filtersList}
      </select>
    </div>
  );
};

export default FilterSelector;
