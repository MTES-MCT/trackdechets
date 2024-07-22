import React, { useEffect, useRef, useState } from "react";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import "./selectWithSubOptions.scss";
import { getLabel, onSelectChange } from "./SelectWithSubOptions.utils";
import { Option } from "../Select/Select";

interface SelectWithSubOptions {
  options: Option[];
  onChange: (values: string[]) => void;
}

const SelectWithSubOptions = ({ options, onChange }: SelectWithSubOptions) => {
  const [selectedOptionsValues, setSelectedOptionsValues] = useState<string[]>(
    []
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const ref = useRef<React.ElementRef<"div"> | null>(null);

  // Trigger the 'onChange' method
  useEffect(() => {
    onChange(selectedOptionsValues);
  }, [selectedOptionsValues, onChange]);

  // Close select if user clicks elsewhere in the page
  useEffect(() => {
    const handleClickInPage = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) setIsOpen(false);
      }
    };

    window.addEventListener("click", handleClickInPage);

    return () => {
      window.removeEventListener("click", handleClickInPage);
    };
  }, [isOpen, ref]);

  const mapOptions = (options, parentPaths: string[] = [], ml = 0) => (
    <>
      {options.map(option => {
        const optionPath = parentPaths.length
          ? [...parentPaths, option.value].join(".")
          : option.value;

        const optionIsAlreadySelected = selectedOptionsValues.some(
          o => o === optionPath
        );

        return (
          <div key={optionPath}>
            <div>
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
                          selectedOptionsValues,
                          setSelectedOptionsValues
                        )
                    }
                  }
                ]}
              />
            </div>

            {/* Option's potential sub-options */}
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

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={ref} className="fr-mt-2v select-wrapper">
      <div
        role={"button"}
        tabIndex={0}
        className={`fr-select select ${isOpen ? "select-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        {getLabel(options, selectedOptionsValues)}
      </div>

      {isOpen && (
        <div className="dropDownWrapper">
          <div className="fr-container-fluid">{mapOptions(options)}</div>
        </div>
      )}
    </div>
  );
};

export default SelectWithSubOptions;
