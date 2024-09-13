import React, { useEffect, useMemo, useRef, useState } from "react";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import "./selectWithSubOptions.scss";
import {
  buildHierarchy,
  getLabel,
  OptionWithChildren
} from "./SelectWithSubOptions.utils";
import { Option } from "../Select/Select";

interface SelectWithSubOptions {
  options: Option[];
  selected: Option[];
  onChange: (e: any) => void;
}

const SelectWithSubOptions = ({
  options,
  onChange,
  selected
}: SelectWithSubOptions) => {
  // const [selectedOptionsValues, setSelectedOptionsValues] = useState<string[]>(
  //   []
  // );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const ref = useRef<React.ElementRef<"div"> | null>(null);

  // Trigger the 'onChange' method
  // useEffect(() => {
  //   // Transform back values array into options array
  //   const optionsFromValues = getOptionsFromValues(
  //     selectedOptionsValues,
  //     options
  //   );

  //   onChange(optionsFromValues);
  // }, [selectedOptionsValues, onChange]);

  // Close select if user clicks elsewhere in the page
  const handleClickInPage = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      if (isOpen) setIsOpen(false);
    }
  };
  useEffect(() => {
    if (isOpen) {
      window.addEventListener("click", handleClickInPage);

      return () => {
        window.removeEventListener("click", handleClickInPage);
      };
    }
  }, [isOpen]);

  const optionsWithChildren = buildHierarchy(options);

  const label = useMemo(() => getLabel(selected), [selected]);

  // const mapOptions = (options, parentPaths: string[] = [], ml = 0) => (
  //   <>
  //     {options.map(option => {
  //       const optionPath = parentPaths.length
  //         ? [...parentPaths, option.value].join(".")
  //         : option.value;

  //       const optionIsAlreadySelected = selected.some(o => o === optionPath);

  //       return (
  //         <div key={optionPath}>
  //           <div>
  //             <Checkbox
  //               className={`optionCheckbox fr-ml-${ml * 4}v`}
  //               options={[
  //                 {
  //                   label: option.label,
  //                   nativeInputProps: {
  //                     name: optionPath,
  //                     checked: optionIsAlreadySelected,
  //                     onChange
  //                   }
  //                 }
  //               ]}
  //             />
  //           </div>

  //           {/* Option's potential sub-options */}
  //           {option.options &&
  //             mapOptions(
  //               option.options,
  //               [...parentPaths, option.value],
  //               ml + 1
  //             )}
  //         </div>
  //       );
  //     })}
  //   </>
  // );

  const mapOptions = (options: OptionWithChildren[], ml = 0) => (
    <>
      {options.map(option => {
        const optionIsAlreadySelected = selected.some(
          o => o.value === option.value
        );

        return (
          <div key={option.label}>
            <div>
              <Checkbox
                className={`optionCheckbox fr-ml-${ml * 4}v`}
                options={[
                  {
                    label: option.label,
                    nativeInputProps: {
                      //name: optionPath,
                      checked: optionIsAlreadySelected,
                      value: option.value,
                      onChange: () => onChange(option)
                    }
                  }
                ]}
              />
            </div>

            {/* Option's potential sub-options */}
            {option.children && mapOptions(option.children, ml + 1)}
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
        {label}
      </div>

      {isOpen && (
        <div className="dropDownWrapper">
          <div className="fr-container-fluid">
            {mapOptions(optionsWithChildren)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectWithSubOptions;
