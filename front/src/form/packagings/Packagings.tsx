import { FieldArray, FieldProps } from "formik";
import React, { InputHTMLAttributes } from "react";

const packagings = [
  { value: "BENNE", label: "Benne" },
  { value: "CITERNE", label: "Citerne" },
  { value: "GRV", label: "GRV" },
  { value: "FUT", label: "Fût" },
  { value: "AUTRE", label: "Autre (à préciser)" },
];

export default function Packagings({
  field: { name, value },
  id,
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldArray
      name={name}
      render={arrayHelpers => (
        <fieldset>
          {packagings.map(p => (
            <label className="label-inline" key={p.value}>
              <input
                type="checkbox"
                name={name}
                value={p.value}
                checked={value.indexOf(p.value) > -1}
                onChange={e => {
                  if (e.target.checked) arrayHelpers.push(p.value);
                  else {
                    const idx = value.indexOf(p.value);
                    arrayHelpers.remove(idx);
                  }
                }}
              />
              {p.label}
              <br />
            </label>
          ))}
        </fieldset>
      )}
    />
  );
}
