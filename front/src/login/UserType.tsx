import { FieldArray, FieldProps } from "formik";
import React, { InputHTMLAttributes } from "react";

export const USER_TYPES = [
  { value: "PRODUCER", label: "Producteur" },
  { value: "COLLECTOR", label: "Collecteur" },
  { value: "WASTEPROCESSOR", label: "Centre de traitement" },
  { value: "TRANSPORTER", label: "Transporteur" }
];

export default function UserType({
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
          {USER_TYPES.map(p => (
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
