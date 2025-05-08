import React from "react";
import { type UseFormReturn, Controller } from "react-hook-form";
import { Select } from "@codegouvfr/react-dsfr/Select";
import NonScrollableInput from "../../../Apps/common/Components/NonScrollableInput/NonScrollableInput";
import { clsx } from "clsx";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

import type { FormShapeFieldWithState } from "./types";
import { formatError } from "./error";
import "./FormTab.scss";

type Props = { fields: FormShapeFieldWithState[]; methods: UseFormReturn<any> };

export function FormTab({ fields, methods }: Props) {
  const { errors } = methods.formState;
  function renderField(field: FormShapeFieldWithState, idx?: number) {
    if (field.shape === "custom") {
      const { Component, props } = field;
      return <Component key={idx} {...props} methods={methods} />;
    }

    if (field.shape === "generic") {
      const label =
        typeof field.label === "string"
          ? [field.label, !field.required ? "(optionnel)" : ""]
              .filter(Boolean)
              .join(" ")
          : field.label;
      return (
        <>
          {field.title && (
            <div className="fr-col-12 fr-mt-2w">
              <h5 className="fr-h5">{field.title}</h5>
            </div>
          )}
          {["text", "number", "date", "time"].includes(field.type) && (
            <div
              className={field.style?.className ?? "fr-col-12"}
              key={field.name}
            >
              <NonScrollableInput
                label={
                  <div className="row-label">
                    {label}
                    {field.tooltip && (
                      <div className="tw-ml-1">
                        <Tooltip title={field.tooltip} />
                      </div>
                    )}
                  </div>
                }
                nativeInputProps={{
                  type: field.type,
                  ...(field.type === "date" && {
                    max: new Date().toISOString().split("T")[0]
                  }),
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
                label={
                  <div className="row-label">
                    {label}
                    {field.tooltip && (
                      <div className="tw-ml-1">
                        <Tooltip title={field.tooltip} />
                      </div>
                    )}
                  </div>
                }
                nativeSelectProps={{
                  ...methods.register(field.name),
                  ...(field.defaultOption && { defaultValue: "" })
                }}
                disabled={field.disabled}
                state={errors?.[field.name] && "error"}
                stateRelatedMessage={formatError(errors?.[field.name])}
              >
                {field.defaultOption && (
                  <option value={""} disabled hidden>
                    {field.defaultOption}
                  </option>
                )}
                {field.choices?.map(choice => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {field.type === "checkbox" && (
            <div
              className={field.style?.className ?? "fr-col-12"}
              key={field.name}
            >
              <Controller
                name={field.name}
                control={methods.control}
                render={({ field: controllerField }) => (
                  <ToggleSwitch
                    label={
                      <div className="row-label">
                        {label}
                        {field.tooltip && (
                          <div className="tw-ml-1">
                            <Tooltip title={field.tooltip} />
                          </div>
                        )}
                      </div>
                    }
                    inputTitle={field.name}
                    showCheckedHint={false}
                    disabled={field.disabled}
                    checked={controllerField.value}
                    onChange={checked => controllerField.onChange(checked)}
                  />
                )}
              />

              {errors?.[field.name] && (
                <Alert
                  className="fr-mt-2w"
                  description={formatError(errors?.[field.name])}
                  severity="error"
                  small
                />
              )}
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
    <div className="registryFormTab">
      {fields.map((field, index) => {
        const fieldValues =
          field.shape === "custom"
            ? methods.watch(field.names)
            : field.shape === "layout"
            ? null
            : methods.watch(field.name);
        const infoText =
          typeof field.infoText === "function"
            ? field.infoText(fieldValues)
            : field.infoText;
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
            {infoText && (
              <div className="fr-mt-5v">
                <Alert description={infoText} severity="info" small />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
