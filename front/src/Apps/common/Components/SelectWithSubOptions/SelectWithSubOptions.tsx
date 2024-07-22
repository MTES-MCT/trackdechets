import React, { useState } from "react";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import "./selectWithSubOptions.scss";
import { getLabel, onSelectChange } from "./SelectWithSubOptions.utils";
import { Option } from "../Select/Select";

interface SelectWithSubOptions {
  options: Option[];
  onChange: () => void;
}

const SelectWithSubOptions = ({ options, onChange }: SelectWithSubOptions) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const mapOptions = (options, parentPaths: string[] = [], ml = 0) => (
    <>
      {options.map((option, idx) => {
        const optionPath = parentPaths.length
          ? [...parentPaths, option.value].join(".")
          : option.value;

        const optionIsAlreadySelected = selectedOptions.some(
          o => o === optionPath
        );

        return (
          <div key={idx} className="optionAndSubOptionWrapper">
            <div className="optionWrapper" key={optionPath}>
              <Checkbox
                className={`optionCheckbox fr-ml-${ml * 4}v`}
                options={[
                  {
                    label: option.label,
                    nativeInputProps: {
                      name: optionPath,
                      checked: optionIsAlreadySelected,
                      onChange: () =>
                        onSelectChange(
                          option,
                          parentPaths,
                          optionPath,
                          selectedOptions,
                          setSelectedOptions
                        )
                    }
                  }
                ]}
              />
            </div>

            {option.options &&
              mapOptions(
                option.options,
                [...parentPaths, option.value],
                ml + 1
              )}
          </div>
        );
      })}
    </>
  );

  return (
    <>
      <select
        className="fr-select select"
        onChange={onChange}
        defaultValue={""}
        onClick={() => setIsOpen(!isOpen)}
      >
        <option value="" hidden>
          {getLabel(options, selectedOptions)}
        </option>
      </select>

      {isOpen && (
        <div className="dropDownWrapper">
          <div className="fr-container-fluid">{mapOptions(options)}</div>
        </div>
      )}
    </>
  );
};

export default SelectWithSubOptions;
