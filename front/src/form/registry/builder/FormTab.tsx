import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select } from "@codegouvfr/react-dsfr/Select";
import NonScrollableInput from "../../../Apps/common/Components/NonScrollableInput/NonScrollableInput";
import { clsx } from "clsx";

import type { FormShapeFieldWithState } from "./types";
import { formatError } from "./error";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

type Props = { fields: FormShapeFieldWithState[]; methods: UseFormReturn<any> };

export function FormTab({ fields, methods }: Props) {
  const { errors } = methods.formState;
  function renderField(field: FormShapeFieldWithState, idx?: number) {
    if (field.shape === "custom") {
      const { Component, props } = field;
      return <Component key={idx} {...props} methods={methods} />;
    }

    if (field.shape === "generic") {
      return (
        <>
          {["text", "number", "date"].includes(field.type) && (
            <div
              className={field.style?.className ?? "fr-col-12"}
              key={field.name}
            >
              <NonScrollableInput
                label={[field.label, !field.required ? "(optionnel)" : ""]
                  .filter(Boolean)
                  .join(" ")}
                nativeInputProps={{
                  type: field.type,
                  ...methods.register(field.name)
                }}
                disabled={field.disabled}
                state={errors?.[field.name] && "error"}
                stateRelatedMessage={formatError(errors?.[field.name])}
              />
            </div>
          )}

          {field.type === "select" && (
            <div
              className={field.style?.className ?? "fr-col-12"}
              key={field.name}
            >
              <Select
                label={[field.label, !field.required ? "(optionnel)" : ""]
                  .filter(Boolean)
                  .join(" ")}
                nativeSelectProps={{
                  ...methods.register(field.name)
                }}
                disabled={field.disabled}
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
              {renderField(field, index)}
            </div>
            {field.infoText && (
              <div className="fr-mt-5v">
                <Alert description={field.infoText} severity="info" small />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
