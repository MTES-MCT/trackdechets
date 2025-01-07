import React, { InputHTMLAttributes, useRef, useEffect } from "react";
import { FieldProps, useField } from "formik";

type NumberInputProps = FieldProps & {
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function NumberInput({ label, ...props }: NumberInputProps) {
  const [field, , { setValue }] = useField(props.field);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnWheel = event => {
      event.preventDefault();
    };

    if (inputRef && inputRef.current) {
      const input = inputRef.current;

      input.addEventListener("wheel", handleOnWheel, {
        passive: false
      });

      return () => {
        input.removeEventListener("wheel", handleOnWheel);
      };
    }
  }, [inputRef]);

  return (
    <label>
      {label}
      <input
        ref={inputRef}
        min="0"
        {...field}
        value={field.value ?? ""}
        {...props}
        onChange={e => {
          // By default, the value is set to `""` if we fill and then delete the value.
          // We want to keep the `null` as a `Float` is expected by gql.
          const cleanedValue = Boolean(e.target.value)
            ? parseFloat(e.target.value)
            : null;
          setValue(cleanedValue);
        }}
        type="number"
        className={props.className}
      />
    </label>
  );
}
