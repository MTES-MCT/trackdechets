import { FieldArray, FieldArrayRenderProps, useField } from "formik";
import React, { useRef } from "react";
import "./TagsInput.scss";

export default function TagsInput(props) {
  const [field] = useField(props);
  const inputContainer = useRef<HTMLInputElement>(null);

  function onInputKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    arrayHelpers: FieldArrayRenderProps
  ) {
    e.stopPropagation();

    const val = (e.target as HTMLInputElement).value;
    if (e.key === "Enter" && val) {
      e.preventDefault();
      if (field.value?.find(tag => tag.toLowerCase() === val.toLowerCase())) {
        return;
      }
      arrayHelpers.push(val);

      if (inputContainer.current) {
        inputContainer.current.value = "";
      }
    }
    if (e.key === "Backspace" && !val && field.value) {
      arrayHelpers.remove(field.value.length - 1);
    }
  }

  return (
    <FieldArray
      name={field.name}
      render={arrayHelpers => (
        <div className="input-tag">
          <ul className="input-tag__tags">
            {field.value?.map((tag, index) => (
              <li key={tag}>
                {tag}
                <button
                  type="button"
                  onClick={() => !props.disabled && arrayHelpers.remove(index)}
                >
                  +
                </button>
              </li>
            ))}
            <li className="input-tag__tags__input">
              <input
                type="text"
                onKeyDown={e => onInputKeyDown(e, arrayHelpers)}
                ref={inputContainer}
                disabled={props.disabled}
              />
            </li>
          </ul>
        </div>
      )}
    />
  );
}
