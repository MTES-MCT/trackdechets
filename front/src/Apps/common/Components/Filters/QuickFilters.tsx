import React, { useEffect, useMemo, useState } from "react";
import QuickFilter from "./QuickFilter";
import { QuickFiltersProp } from "./filtersTypes";
import { useMedia } from "../../../../common/use-media";
import { MEDIA_QUERIES } from "../../../../common/config";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { debounce } from "../../../../common/helper";

const DEBOUNCE_DELAY = 500;

const filtersDefaultValue = filters => {
  const value = {};
  filters.forEach(filter => (value[filter.name] = ""));
  return value;
};

const QuickFilters = ({ onApplyFilters, filters }: QuickFiltersProp) => {
  const [filterValues, setFilterValues] = useState(
    filtersDefaultValue(filters)
  );

  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  const onFilterValueChange = (e, filterName) => {
    const { value } = e.target;
    const newFilterValues = { ...filterValues };
    if (!newFilterValues[filterName] || newFilterValues[filterName] !== value) {
      newFilterValues[filterName] = value;
      setFilterValues(newFilterValues);
    }
  };

  const debouncedOnApplyFilters = useMemo(() => {
    return debounce(onApplyFilters, DEBOUNCE_DELAY);
  }, [onApplyFilters]);

  useEffect(() => {
    debouncedOnApplyFilters(filterValues);
  }, [debouncedOnApplyFilters, filterValues, onApplyFilters]);

  const filterInputs = (
    <div className={"fr-grid-row fr-grid-row--gutters"}>
      {filters
        .filter(filter => filter.isActive)
        .map(filter => (
          <div
            className={"fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl"}
            key={`quickFilter-${filter.name}`}
          >
            <QuickFilter
              label={filter.label}
              value={filterValues[filter.name]}
              placeholder={filter.placeholder}
              onChange={e => onFilterValueChange(e, filter.name)}
            />
          </div>
        ))}
    </div>
  );

  if (isMobile) {
    return (
      <Accordion label="Recherche rapide" className={"fr-mb-2w"}>
        {filterInputs}
      </Accordion>
    );
  }

  return <div className={"fr-container-fluid fr-mb-2w"}>{filterInputs}</div>;
};

export default QuickFilters;
