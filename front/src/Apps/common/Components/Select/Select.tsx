import React, { ReactNode, useMemo } from "react";
import { filter_type_select_option_placeholder } from "../../wordings/dashboard/wordingsDashboard";
import MultiSelectWrapper from "../MultiSelect/MultiSelect";
import SelectWithSubOptions from "../SelectWithSubOptions/SelectWithSubOptions";

export interface Option {
  value: string;
  label: string;
  options?: Option[];
}

interface SelectProps {
  label?: string;
  id?: string;
  options: Option[];
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
    const select: ReactNode = useMemo(() => {
      const hasSubOptions = options.some(o => o.options?.length);

      if (hasSubOptions) {
        return <SelectWithSubOptions options={options} onChange={onChange} />;
      } else if (isMultiple) {
        return (
          <MultiSelectWrapper
            options={options}
            selected={selected}
            onChange={onChange}
            placeholder={placeholder}
            disableSearch={disableSearch}
            showRendererText={showRendererText}
          />
        );
      }

      return (
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
      );
    }, [
      label,
      options,
      id,
      isMultiple,
      // Bug: uncommenting those values provokes infinite re-renders
      // onChange,
      // selected,
      disableSearch,
      defaultValue,
      placeholder,
      showRendererText,
      ref
    ]);

    return (
      <div className="fr-select-group">
        {label && (
          <label className="fr-label" htmlFor={id}>
            {label}
          </label>
        )}

        {select}
      </div>
    );
  }
);

export default React.memo(Select);
