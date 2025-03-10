import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";

import type { FormShapeField } from "./types";

type Props = { fields: FormShapeField[]; methods: UseFormReturn<any> };

export function FormTab({ fields, methods }: Props) {
  return fields.map(field => {
    return (
      <div className="fr-mb-2w">
        {field.shape === "custom" && (
          <field.Component name={field.name} methods={methods} />
        )}

        {field.shape === "generic" && (
          <div className="fr-grid-row fr-grid-row--gutters">
            {["text", "number", "date"].includes(field.type) && (
              <Input
                label={[
                  field.label,
                  !field.validation.required ? "(Optionnel)" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                className={field.style?.className}
                nativeInputProps={{
                  type: field.type,
                  required: field.validation.required,
                  ...methods.register(field.name)
                }}
              />
            )}

            {field.type === "select" && (
              <Select
                label={[
                  field.label,
                  !field.validation.required ? "(Optionnel)" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                className={field.style?.className}
                nativeSelectProps={{
                  required: field.validation.required,
                  ...methods.register(field.name)
                }}
              >
                <option value="">Selectionnez une option</option>
                {field.choices?.map(choice => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}
      </div>
    );
  });
}
