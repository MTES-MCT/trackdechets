import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { formatError } from "../builder/error";
import { CountrySelector } from "./CountrySelector";

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

  return (
    <>
      {nameEnabled && (
        <div className="fr-col-8">
          <Input
            label="Nom"
            nativeInputProps={{
              type: "text",
              disabled,
              ...methods.register(`${prefix}Name`)
            }}
            state={errors?.[`${prefix}Name`] && "error"}
            stateRelatedMessage={formatError(errors?.[`${prefix}Name`])}
          />
        </div>
      )}
      <div className="fr-col-8">
        <Input
          label="Adresse (n° de voie et voie, complément, lieu-dit etc.)"
          nativeInputProps={{
            type: "text",
            disabled,
            ...methods.register(`${prefix}Address`)
          }}
          state={errors?.[`${prefix}Address`] && "error"}
          stateRelatedMessage={formatError(errors?.[`${prefix}Address`])}
        />
      </div>
      <div className="fr-col-4">
        <Input
          label="Code postal"
          nativeInputProps={{
            type: "number",
            disabled,
            ...methods.register(`${prefix}PostalCode`)
          }}
          state={errors?.[`${prefix}PostalCode`] && "error"}
          stateRelatedMessage={formatError(errors?.[`${prefix}PostalCode`])}
        />
      </div>
      <div className="fr-col-8">
        <Input
          label="Commune"
          nativeInputProps={{
            type: "text",
            disabled,
            ...methods.register(`${prefix}City`)
          }}
          state={errors?.[`${prefix}City`] && "error"}
          stateRelatedMessage={formatError(errors?.[`${prefix}City`])}
        />
      </div>
      <div className="fr-col-4">
        <CountrySelector methods={methods} prefix={prefix} />
      </div>
    </>
  );
}
