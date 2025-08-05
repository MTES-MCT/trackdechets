import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { formatError } from "../builder/error";
import { CountrySelector } from "./CountrySelector";
import NonScrollableInput from "../../../Apps/common/Components/NonScrollableInput/NonScrollableInput";

type InlineProps = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  nameEnabled?: boolean;
};

type BlockProps = InlineProps & {
  title?: string;
};

export function Address({
  prefix,
  methods,
  title,
  disabled,
  nameEnabled
}: BlockProps) {
  return (
    <div className="fr-col">
      {title && <h5 className="fr-h5">{title}</h5>}
      <div className="fr-grid-row fr-grid-row--gutters">
        <InlineAddress
          prefix={prefix}
          methods={methods}
          disabled={disabled}
          nameEnabled={nameEnabled}
        />
      </div>
    </div>
  );
}

export function InlineAddress({
  prefix,
  methods,
  disabled,
  nameEnabled
}: InlineProps) {
  const { errors } = methods.formState;
  // handle errors when this component is used in an array of fields, and the errors are nested
  // ex: errors.transporter.0.CompanyName
  let deepErrors = errors;
  const prefixSplit = prefix.split(".");
  const finalPrefix = prefixSplit[prefixSplit.length - 1];
  if (prefixSplit.length > 1) {
    deepErrors = errors?.[prefixSplit[0]]?.[prefixSplit[1]];
  }
  return (
    <>
      {nameEnabled && (
        <div className="fr-col-12 fr-col-md-8">
          <Input
            label="Nom"
            nativeInputProps={{
              type: "text",
              disabled,
              ...methods.register(`${prefix}Name`)
            }}
            state={deepErrors?.[`${finalPrefix}Name`] && "error"}
            stateRelatedMessage={formatError(
              deepErrors?.[`${finalPrefix}Name`]
            )}
          />
        </div>
      )}
      <div className="fr-col-md-8">
        <Input
          label="Adresse (n° de voie et voie, complément, lieu-dit etc.)"
          nativeInputProps={{
            type: "text",
            disabled,
            ...methods.register(`${prefix}Address`)
          }}
          state={deepErrors?.[`${finalPrefix}Address`] && "error"}
          stateRelatedMessage={formatError(
            deepErrors?.[`${finalPrefix}Address`]
          )}
        />
      </div>
      <div className="fr-col-md-4">
        <NonScrollableInput
          label="Code postal"
          nativeInputProps={{
            type: "text",
            disabled,
            ...methods.register(`${prefix}PostalCode`)
          }}
          state={deepErrors?.[`${finalPrefix}PostalCode`] && "error"}
          stateRelatedMessage={formatError(
            deepErrors?.[`${finalPrefix}PostalCode`]
          )}
        />
      </div>
      <div className="fr-col-10 fr-col-md-8">
        <Input
          label="Commune"
          nativeInputProps={{
            type: "text",
            disabled,
            ...methods.register(`${prefix}City`)
          }}
          state={deepErrors?.[`${finalPrefix}City`] && "error"}
          stateRelatedMessage={formatError(deepErrors?.[`${finalPrefix}City`])}
        />
      </div>
      <div className="fr-col-md-4">
        <CountrySelector methods={methods} prefix={prefix} />
      </div>
    </>
  );
}
