import React, { useEffect, useState } from "react";
import { FiltersProps } from "./filtersTypes";
import QuickFilters from "./QuickFilters";
import AdvancedFilters from "./AdvancedFilters";
import { isEqual } from "lodash";

import "./filters.scss";
import {
  advancedFilterList,
  quickFilterList
} from "../../../Dashboard/dashboardUtils";

const purgeEmptyValues = (obj: { [key: string]: string | string[] }) => {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => {
      return value === null || value === "" ? undefined : value;
    })
  );
};

const Filters = ({
  areAdvancedFiltersOpen = false,
  onApplyFilters
}: FiltersProps) => {
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [quickFilters, setQuickFilters] = useState({});

  // Combination & purge of advanced & quick filters
  const [filters, setFilters] = useState({});

  const onApplyAdvancedFilters = filters => {
    setAdvancedFilters(filters);
  };

  const onApplyQuickFilters = filters => {
    setQuickFilters(filters);
  };

  useEffect(() => {
    // Aggregate quick & advanced filters and remove empty values
    const newFilters = purgeEmptyValues({
      ...advancedFilters,
      ...quickFilters
    });

    // If filters have actually changed, bubble up
    if (!isEqual(filters, newFilters)) {
      onApplyFilters(newFilters);
      setFilters(newFilters);
    }
  }, [advancedFilters, onApplyFilters, quickFilters, filters]);

  return (
    <div className="filters">
      <AdvancedFilters
        open={areAdvancedFiltersOpen}
        filters={advancedFilterList}
        onApplyFilters={onApplyAdvancedFilters}
      />

      <QuickFilters
        filters={quickFilterList}
        onApplyFilters={onApplyQuickFilters}
      />
    </div>
  );
};

export default React.memo(Filters);
