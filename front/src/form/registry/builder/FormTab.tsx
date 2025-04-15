import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { clsx } from "clsx";
import { RegistryLineReason } from "@td/codegen-ui";

import type { FormShapeField } from "./types";
import { formatError } from "./error";

type Props = { fields: FormShapeField[]; methods: UseFormReturn<any> };

export function FormTab({ fields, methods }: Props) {
  const { errors } = methods.formState;
  const reason = methods.getValues("reason");
  function renderField(field: FormShapeField, idx?: number) {
    if (field.shape === "custom") {
      const { Component, props } = field;
      return <Component key={idx} {...props} methods={methods} />;
    }

    if (field.shape === "generic") {
      return (
        <>
          {["text", "number", "date"].includes(field.type) && (
            <div className={field.style?.className ?? "fr-col-12"}>
              <Input
                key={field.name}
                label={[field.label, !field.required ? "(optionnel)" : ""]
                  .filter(Boolean)
                  .join(" ")}
                nativeInputProps={{
                  type: field.type,
                  ...methods.register(field.name)
                }}
                disabled={
                  field.disableOnModify && reason === RegistryLineReason.Edit
                }
                state={errors?.[field.name] && "error"}
                stateRelatedMessage={formatError(errors?.[field.name])}
              />
            </div>
          )}

          {field.type === "select" && (
            <div className={field.style?.className ?? "fr-col-12"}>
              <Select
                key={field.name}
                label={[field.label, !field.required ? "(optionnel)" : ""]
                  .filter(Boolean)
                  .join(" ")}
                nativeSelectProps={{
                  ...methods.register(field.name)
                }}
                disabled={
                  field.disableOnModify && reason === RegistryLineReason.Edit
                }
                state={errors?.[field.name] && "error"}
                stateRelatedMessage={formatError(errors?.[field.name])}
              >
                {field.choices?.map(choice => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </>
      );
    }

    if (field.shape === "layout") {
      return <>{field.fields.map((f, idx) => renderField(f, idx))}</>;
    }
  }

  return (
    <div>
      {fields.map((field, index) => {
        return (
          <div className="fr-mb-2w" key={index}>
            <div
              className={clsx(
                "fr-grid-row fr-grid-row--gutters",
                field.style?.parentClassName
              )}
            >
              {renderField(field)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
