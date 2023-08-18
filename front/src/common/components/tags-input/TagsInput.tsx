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

    const value = (e.target as HTMLInputElement).value;
    if (["Enter", "Tab"].includes(e.key)) {
      e.preventDefault();
      addTag(value, arrayHelpers);
    }
    if (e.key === "Backspace" && !value && field.value) {
      arrayHelpers.remove(field.value.length - 1);
    }
  }

  function onBlur(
    e: React.FocusEvent<HTMLInputElement>,
    arrayHelpers: FieldArrayRenderProps
  ) {
    const value = (e.target as HTMLInputElement).value;
    addTag(value, arrayHelpers);
  }

  function addTag(value: string, arrayHelpers: FieldArrayRenderProps) {
    if (
      !value ||
      field.value?.find(tag => tag.toLowerCase() === value.toLowerCase()) ||
      (props.limit && field.value?.length >= props.limit)
    ) {
      return;
    }
    arrayHelpers.push(value);

    if (inputContainer.current) {
      inputContainer.current.value = "";
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
                  onClick={e => {
                    e.preventDefault();
                    !props.disabled && arrayHelpers.remove(index);
                  }}
                >
                  +
                </button>
              </li>
            ))}
            <li className="input-tag__tags__input" id={field.name}>
              <input
                type="text"
                onKeyDown={e => onInputKeyDown(e, arrayHelpers)}
                onBlur={e => onBlur(e, arrayHelpers)}
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
