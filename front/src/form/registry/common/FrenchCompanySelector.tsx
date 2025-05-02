import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { CompanySearchResult } from "@td/codegen-ui";
import CompanySelectorWrapper from "../../../Apps/common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { formatError } from "../builder/error";
import cn from "classnames";
import "./FrenchCompanySelector.scss";
type InlineProps = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  shortMode?: boolean; // For company on which we only need the SIRET & name. No address, post code...
  title?: string;
};

type BlockProps = InlineProps & {
  reducedMargin?: boolean;
};

export function FrenchCompanySelector({
  prefix,
  methods,
  disabled,
  shortMode,
  reducedMargin,
  title
}: BlockProps) {
  return (
    <div
      className={cn("fr-col", {
        "company-selector-reduced-margin": reducedMargin
      })}
    >
      {title && <h5 className="fr-h5">{title}</h5>}
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
}: InlineProps) {
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
            selectedCompanyError={selectedCompanyError}
            allowForeignCompanies={false}
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

const selectedCompanyError = (company: CompanySearchResult) => {
  if (company.etatAdministratif !== "A") {
    // Lors de l'écriture de ces lignes, `searchCompanies` renvoie des établissements
    // fermés lorsque l'on fait une recherche pas raison sociale. Si ce problème est traité
    // dans le futur, on pourra s'abstenir de gérer cette erreur.
    return "Cet établissement est fermé";
  }
  return null;
};
