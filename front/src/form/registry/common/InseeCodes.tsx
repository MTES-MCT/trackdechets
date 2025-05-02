import React from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { formatError } from "../builder/error";

type Props = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  title?: string;
};

export function InseeCodes({ methods, disabled, prefix, title }: Props) {
  return (
    <div className="fr-col">
      {title && <h5 className="fr-h5">{title}</h5>}
      <InlineInseeCodes methods={methods} disabled={disabled} prefix={prefix} />
    </div>
  );
}

export function InlineInseeCodes({ methods, disabled, prefix }: Props) {
  const {
    fields: inseeCodeFields,
    append: appendInseeCode,
    remove: removeInseeCode
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}MunicipalitiesInseeCodes`
  });
  const { errors } = methods.formState;
  const inseeCodeErrors = errors?.[`${prefix}MunicipalitiesInseeCodes`];
  return (
    <>
      {inseeCodeFields.map((field, index) => (
        <div key={field.id} className="fr-col-8">
          <p className="fr-mb-2v tw-text-lg tw-font-bold">
            Commune n°{index + 1}
          </p>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
            <div className="fr-col-5">
              <Input
                label="Code INSEE"
                nativeInputProps={{
                  type: "text",
                  disabled,
                  ...methods.register(
                    `${prefix}MunicipalitiesInseeCodes.${index}`
                  )
                }}
                state={inseeCodeErrors && inseeCodeErrors[index] && "error"}
                stateRelatedMessage={
                  inseeCodeErrors?.[index] &&
                  formatError(inseeCodeErrors[index])
                }
              />
            </div>
            <div className="fr-col-4">
              <Button
                type="button"
                className="fr-mt-2v"
                priority="secondary"
                onClick={() => removeInseeCode(index)}
                disabled={disabled}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      ))}

      <div className="fr-col-8">
        <Button
          type="button"
          className="fr-mt-2v"
          priority="secondary"
          onClick={() => appendInseeCode("")}
          disabled={disabled}
        >
          Ajouter une commune
        </Button>
      </div>
    </>
  );
}
