import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import CompanySelectorWrapper from "../../../Apps/common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { formatError } from "../builder/error";

type Props = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  shortMode?: boolean; // For company on which we only need the SIRET & name. No address, post code...
  title?: string;
};

export function FrenchCompanySelector({
  prefix,
  methods,
  disabled,
  shortMode,
  title
}: Props) {
  return (
    <div className="fr-col">
      {title && <h4 className="fr-h4">{title}</h4>}

      <InlineFrenchCompanySelector
        prefix={prefix}
        methods={methods}
        disabled={disabled}
        shortMode={shortMode}
      />
    </div>
  );
}

export function InlineFrenchCompanySelector({
  prefix,
  methods,
  disabled,
  shortMode
}: Props) {
  const fieldName = shortMode ? `${prefix}Siret` : `${prefix}CompanyOrgId`;

  const selectedCompanyOrgId = methods.watch(fieldName);
  const { errors } = methods.formState;

  return (
    <Controller
      name={fieldName}
      control={methods.control}
      render={({ field }) => (
        <>
          <CompanySelectorWrapper
            selectedCompanyOrgId={selectedCompanyOrgId}
            disabled={disabled}
            onCompanySelected={company => {
              if (company) {
                field.onChange(company.orgId);

                if (shortMode) {
                  methods.setValue(`${prefix}Name`, company.name);
                } else {
                  methods.setValue(`${prefix}CompanyName`, company.name);
                  methods.setValue(
                    `${prefix}CompanyAddress`,
                    company.addressVoie
                  );
                  methods.setValue(`${prefix}CompanyCity`, company.addressCity);
                  methods.setValue(
                    `${prefix}CompanyPostalCode`,
                    company.addressPostalCode
                  );
                  methods.setValue(`${prefix}CompanyCountryCode`, "FR");
                }
              }
            }}
          />

          {errors?.[fieldName] && (
            <Alert
              description={formatError(errors[fieldName])}
              severity="error"
              small
            />
          )}
          {errors?.[`${prefix}CompanyAddress`] && (
            <Alert
              description={formatError(errors[`${prefix}CompanyAddress`])}
              severity="error"
              small
            />
          )}
        </>
      )}
    />
  );
}
