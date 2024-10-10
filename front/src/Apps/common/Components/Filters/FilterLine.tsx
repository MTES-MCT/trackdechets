import React, { Children, ReactElement } from "react";
import {
  max_filter_autorized_label,
  sr_btn_add_filter_line,
  sr_btn_delete_filter_line
} from "../../wordings/dashboard/wordingsDashboard";
import FilterSelector from "./FilterSelector";
import { Filter } from "./filtersTypes";

interface FilterLineProps {
  filters: Filter[][];
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onAddFilterType: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  onRemoveFilterType: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    value?: string
  ) => void;
  disabledSelect?: boolean;
  value?: string;
  srLabel?: string;
  children?: ReactElement;
  isMaxLine: boolean;
  isCurrentLine: boolean;
}

const FilterLine = ({
  filters,
  onChange,
  disabledSelect,
  onRemoveFilterType,
  onAddFilterType,
  value,
  children,
  isMaxLine,
  isCurrentLine,
  srLabel = ""
}: FilterLineProps) => (
  <div className="filters__line">
    <div className="filters__line__item">
      <FilterSelector
        filters={filters}
        onChange={onChange}
        value={value}
        disabled={disabledSelect}
      />
      {Children.toArray(children).length > 0 && (
        <div className="item-to-fill">{children}</div>
      )}
    </div>
    <div className="filters__line__btn">
      <button
        type="button"
        className="fr-btn fr-btn--secondary"
        onClick={e => onRemoveFilterType(e, value)}
        id={`${value}_delete_btn`}
      >
        <span aria-hidden>-</span>
        <span className="sr-only">{`${sr_btn_delete_filter_line} ${srLabel}`}</span>
      </button>
      {isCurrentLine && (
        <button
          type="button"
          className="fr-btn fr-btn--secondary"
          onClick={e => {
            onAddFilterType(e);
            e.currentTarget.setAttribute("aria-expanded", "true");
          }}
          id={`${value}_add_btn`}
          title={isMaxLine ? max_filter_autorized_label : ""}
          disabled={isMaxLine}
          aria-expanded={false}
        >
          <span aria-hidden>+</span>
          <span className="sr-only">{`${sr_btn_add_filter_line} ${
            isMaxLine ? max_filter_autorized_label : ""
          }`}</span>
        </button>
      )}
    </div>
  </div>
);

export default FilterLine;
