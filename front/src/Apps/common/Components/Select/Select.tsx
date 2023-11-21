import React from "react";
import { filter_type_select_option_placeholder } from "../../wordings/dashboard/wordingsDashboard";
import MultiSelectWrapper from "../MultiSelect/MultiSelect";

interface SelectProps {
  label?: string;
  id?: string;
  options: { value: string; label: string }[];
  selected?: any;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  isMultiple?: boolean;
  showRendererText?: boolean;
  disableSearch?: boolean; // hide react-multi-select-component search textbox
  defaultValue?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      id,
      onChange,
      isMultiple,
      selected,
      disableSearch,
      defaultValue,
      placeholder = filter_type_select_option_placeholder,
      showRendererText = true
    },
    ref
  ) => {
    return (
      <div className="fr-select-group">
        {label && (
          <label className="fr-label" htmlFor={id}>
            {label}
          </label>
        )}
        {!isMultiple ? (
          <select
            ref={ref}
            id={id}
            className="fr-select"
            onChange={onChange}
            defaultValue={defaultValue}
          >
            <option value="" disabled hidden>
              {placeholder}
            </option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <MultiSelectWrapper
            options={options}
            selected={selected}
            onChange={onChange}
            placeholder={placeholder}
            disableSearch={disableSearch}
            showRendererText={showRendererText}
          />
        )}
      </div>
    );
  }
);

export default React.memo(Select);
