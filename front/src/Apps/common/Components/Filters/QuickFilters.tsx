import React, { ChangeEvent } from "react";
import QuickFilter from "./QuickFilter";
import { Filter } from "./filtersTypes";

import "./quickFilters.scss";

interface QuickFiltersProp {
  filters: Filter[];
  onChange: (e: ChangeEvent<HTMLInputElement>, filterName: string) => void;
}

const QuickFilters = ({ filters, onChange }: QuickFiltersProp) => {
  return (
    <div className={"fr-container-fluid fr-mb-2w quickFilters"}>
      <div className={"fr-grid-row  fr-grid-row--gutters"}>
        {filters.map(filter => (
          <div className={"fr-col-12 fr-col-sm-6 fr-col-md"}>
            <QuickFilter
              label={filter.label}
              onChange={e => onChange(e, filter.name)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickFilters;
