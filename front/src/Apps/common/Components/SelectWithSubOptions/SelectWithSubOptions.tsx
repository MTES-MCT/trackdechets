import React, { useState } from "react";
import { filter_type_select_option_placeholder } from "../../wordings/dashboard/wordingsDashboard";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { FieldArray } from "formik";
import "./selectWithSubOptions.scss";

export const SelectWithSubOptions = ({
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
}) => {
  const [value, setValue] = useState({});
  const [isOpen, setIsOpen] = useState<boolean>(false);

  console.log("value", value);

  const mapOptions = (options, parentPath = null, ml = 0) => (
    <>
      {options.map((option, idx) => {
        const optionPath = parentPath
          ? `${parentPath}.${option.value}`
          : option.value;

        return (
          <div key={idx} className="optionAndSubOptionWrapper">
            <div className="optionWrapper" key={optionPath}>
              <Checkbox
                className={`optionCheckbox fr-ml-${ml}v`}
                options={[
                  {
                    label: option.label,
                    nativeInputProps: {
                      name: optionPath,
                      checked: Boolean(value[optionPath]),
                      onClick: () => {
                        if (value[optionPath])
                          setValue({ ...value, [optionPath]: undefined });
                        else setValue({ ...value, [optionPath]: true });
                      }
                    }
                  }
                ]}
              />
            </div>

            {option.options && mapOptions(option.options, optionPath, ml + 1)}
          </div>
        );
      })}
    </>
  );

  return (
    <>
      <select
        id={id}
        className="fr-select select"
        onChange={onChange}
        defaultValue={defaultValue}
        onClick={() => setIsOpen(!isOpen)}
      >
        <option value="" disabled hidden>
          Sélectionner une option
        </option>
      </select>

      {isOpen && (
        <div className="downDownWrapper">
          {/* <FieldArray
            name={"test"}
            render={arrayHelpers => ( */}
          <div className="fr-container-fluid">{mapOptions(options)}</div>
          {/* )}
          /> */}
        </div>
      )}
    </>
  );
};
