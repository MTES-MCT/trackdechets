import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React, { useState } from "react";
import {
  Controller,
  type UseFormSetValue,
  type UseFormReturn
} from "react-hook-form";
import { CompanySearchResult } from "@td/codegen-ui";
import CompanySelectorWrapper from "../../../Apps/common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { formatError } from "../builder/error";
import cn from "classnames";
import "./FrenchCompanySelector.scss";
export type InlineFrenchCompanySelectorProps = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  shortMode?: boolean; // For company on which we only need the SIRET & name. No address, post code...
  title?: string;
  onCompanySelected?: (
    company: CompanySearchResult,
    setValue: UseFormSetValue<any>
  ) => void;
};

type BlockProps = InlineFrenchCompanySelectorProps & {
  reducedMargin?: boolean;
};

export function FrenchCompanySelector({
  prefix,
  methods,
  disabled,
  shortMode,
  reducedMargin,
  title,
  onCompanySelected
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
        onCompanySelected={onCompanySelected}
      />
    </div>
  );
}

export function InlineFrenchCompanySelector({
  prefix,
  methods,
  disabled,
  shortMode,
  onCompanySelected
}: InlineFrenchCompanySelectorProps) {
  const [unknownCompanyError, setUnknownCompanyError] = useState(false);
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
            allowClosedCompanies={true}
            onCompanySelected={company => {
              if (company) {
                field.onChange(company.orgId);
                setUnknownCompanyError(false);
                // this is not a registry field, it is used to communicate to the outside of this component
                // so the company selection can be adapted for the case of private companies
                methods.setValue(
                  `${prefix}CompanyStatusDiffusion`,
                  company.statutDiffusionEtablissement
                );
                if (company.orgId === selectedCompanyOrgId) {
                  return;
                }
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

                onCompanySelected?.(company, methods.setValue);
              }
            }}
            onUnknownInputCompany={() => {
              setUnknownCompanyError(true);
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
          {unknownCompanyError && (
            <Alert
              title="L'établissement mentionné n'existe pas dans la base SIRENE"
              description={
                <div>
                  <p>SIRET : {selectedCompanyOrgId}</p>
                  <p>
                    Dénomination :{" "}
                    {shortMode
                      ? methods.getValues(`${prefix}Name`)
                      : methods.getValues(`${prefix}CompanyName`)}
                  </p>
                  {!shortMode && (
                    <p>
                      Adresse :{" "}
                      {[
                        methods.getValues(`${prefix}CompanyAddress`),
                        methods.getValues(`${prefix}CompanyPostalCode`),
                        methods.getValues(`${prefix}CompanyCity`)
                      ].join(" ")}
                    </p>
                  )}
                </div>
              }
              severity="error"
              small
            />
          )}
        </>
      )}
    />
  );
}

export const selectedCompanyError = (company: CompanySearchResult) => {
  if (company.etatAdministratif !== "A") {
    // Lors de l'écriture de ces lignes, `searchCompanies` renvoie des établissements
    // fermés lorsque l'on fait une recherche pas raison sociale. Si ce problème est traité
    // dans le futur, on pourra s'abstenir de gérer cette erreur.
    return "Cet établissement est fermé";
  }
  return null;
};
