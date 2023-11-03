import React, { useState } from "react";
import QuickFilter from "./QuickFilter";
import { QuickFiltersProp } from "./filtersTypes";

const QuickFilters = ({ onApplyFilters, filters }: QuickFiltersProp) => {
  const [filterValues, setFilterValues] = useState({});

  const onFilterValueChange = (e, filterName) => {
    const { value } = e.target;
    const newFilterValues = { ...filterValues };
    if (!newFilterValues[filterName] || newFilterValues[filterName] !== value) {
      newFilterValues[filterName] = value;
      setFilterValues(newFilterValues);

      onApplyFilters(newFilterValues);
    }
  };

  return (
    <div className={"fr-container-fluid fr-mb-2w"}>
      <div className={"fr-grid-row fr-grid-row--gutters"}>
        {filters
          .filter(filter => filter.isActive)
          .map(filter => (
            <div
              className={"fr-col-12 fr-col-sm-6 fr-col-md"}
              key={`quickFilter-${filter.name}`}
            >
              <QuickFilter
                label={filter.label}
                placeholder={filter.placeholder}
                onChange={e => onFilterValueChange(e, filter.name)}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default QuickFilters;
