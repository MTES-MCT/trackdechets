import React, { InputHTMLAttributes } from "react";
import { FieldProps, useField } from "formik";

type NumberInputProps = FieldProps & { label: string } & InputHTMLAttributes<
    HTMLInputElement
  >;

export default function NumberInput({ label, ...props }: NumberInputProps) {
  const [field, , { setValue }] = useField(props.field);

  return (
    <label>
      {label}
      <input
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
