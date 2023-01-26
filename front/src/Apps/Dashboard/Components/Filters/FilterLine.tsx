import React, { Children, ReactElement } from "react";
import FilterPlaceholderSelect from "./FilterPlaceholderSelect";
import { Filter } from "./filtersTypes";

interface FilterLineProps {
  filters: Filter[];
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
  children?: ReactElement;
}

const FilterLine = ({
  filters,
  onChange,
  disabledSelect,
  onRemoveFilterType,
  onAddFilterType,
  value,
  children,
}: FilterLineProps) => (
  <div className="filters__line">
    <div className="filters__line__item">
      <FilterPlaceholderSelect
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
        - <span className="sr-only">supprimer un filtre</span>
      </button>
      <button
        type="button"
        className="fr-btn fr-btn--secondary"
        onClick={onAddFilterType}
        id={`${value}_add_btn`}
      >
        + <span className="sr-only">ajouter un filtre</span>
      </button>
    </div>
  </div>
);

export default FilterLine;
