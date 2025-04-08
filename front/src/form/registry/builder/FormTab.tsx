import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { clsx } from "clsx";

import type { FormShapeField } from "./types";
import { formatError } from "./error";

type Props = { fields: FormShapeField[]; methods: UseFormReturn<any> };

export function FormTab({ fields, methods }: Props) {
  const { errors } = methods.formState;

  function renderField(field: FormShapeField, idx?: number) {
    if (field.shape === "custom") {
      const { Component, props } = field;
      return <Component key={idx} {...props} methods={methods} />;
    }

    if (field.shape === "generic") {
      return (
        <>
          {["text", "number", "date"].includes(field.type) && (
            <Input
              key={field.name}
              label={[
                field.label,
                !field.validation.required ? "(Optionnel)" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              className={field.style?.className}
              nativeInputProps={{
                type: field.type,
                ...methods.register(field.name, {
                  required: field.validation.required
                })
              }}
              state={errors?.[field.name] && "error"}
              stateRelatedMessage={formatError(errors?.[field.name])}
            />
          )}

          {field.type === "select" && (
            <Select
              key={field.name}
              label={[
                field.label,
                !field.validation.required ? "(Optionnel)" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              className={field.style?.className}
              nativeSelectProps={{
                ...methods.register(field.name, {
                  required: field.validation.required
                })
              }}
              state={errors?.[field.name] && "error"}
              stateRelatedMessage={formatError(errors?.[field.name])}
            >
              <option value="">Selectionnez une option</option>
              {field.choices?.map(choice => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </Select>
          )}
        </>
      );
    }

    if (field.shape === "layout") {
      return <>{field.fields.map((f, idx) => renderField(f, idx))}</>;
    }
  }

  return (
    <div className="tw-overflow-y-auto tw-overflow-x-hidden">
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
