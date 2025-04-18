import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { formatError } from "../builder/error";

type Props = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
};

export function Address({ prefix, methods, disabled }: Props) {
  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <InlineAddress prefix={prefix} methods={methods} disabled={disabled} />
      </div>
    </div>
  );
}

export function InlineAddress({ prefix, methods, disabled }: Props) {
  const { errors } = methods.formState;

  return (
    <>
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
        <Input
          label="Code pays"
          nativeInputProps={{
            type: "text",
            placeholder: "FR",
            disabled,
            ...methods.register(`${prefix}CountryCode`)
          }}
          state={errors?.[`${prefix}CountryCode`] && "error"}
          stateRelatedMessage={formatError(errors?.[`${prefix}CountryCode`])}
        />
      </div>
    </>
  );
}
