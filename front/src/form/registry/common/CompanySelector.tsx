import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import React, { useEffect } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import CompanySelectorWrapper from "../../../Apps/common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { formatError } from "../builder/error";

type Props = {
  prefix: string;
  label: string;
  methods: UseFormReturn<any>;
  excludeTypes?: string[];
  showNullOption?: boolean;
};

const TYPES = {
  ETABLISSEMENT_FR: "Etablissement français",
  ENTREPRISE_UE: "Entreprise UE",
  ENTREPRISE_HORS_UE: "Entreprise hors UE",
  ASSOCIATION: "Association",
  PERSONNE_PHYSIQUE: "Personne physique"
};

export function CompanySelector({
  prefix,
  label,
  excludeTypes,
  showNullOption = true,
  methods
}: Props) {
  const companyType = methods.watch(`${prefix}CompanyType`, "ETABLISSEMENT_FR");
  const selectedCompanyOrgId = methods.watch(`${prefix}CompanyOrgId`);

  const { errors } = methods.formState;

  useEffect(() => {
    if (companyType === "") {
      methods.setValue(`${prefix}CompanyOrgId`, "");
      methods.setValue(`${prefix}CompanyName`, "");
      methods.setValue(`${prefix}CompanyAddress`, "");
      methods.setValue(`${prefix}CompanyPostalCode`, "");
      methods.setValue(`${prefix}CompanyCity`, "");
      methods.setValue(`${prefix}CompanyCountryCode`, "");
    }
  }, [companyType, methods, prefix]);

  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-8 fr-mb-2w">
          <Select
            label={`Type de ${label}`}
            nativeSelectProps={{
              ...methods.register(`${prefix}CompanyType`)
            }}
          >
            {Object.entries(TYPES)
              .filter(([key]) => !excludeTypes?.includes(key))
              .map(([key, value]) => (
                <option value={key} key={key}>
                  {value}
                </option>
              ))}
            {showNullOption && (
              <option value={""}>{"Aucune destination"}</option>
            )}
          </Select>
        </div>
      </div>
      {errors?.[`${prefix}CompanyType`] && (
        <Alert
          description={formatError(errors[`${prefix}CompanyType`])}
          severity="error"
          small
        />
      )}
      {companyType === "ETABLISSEMENT_FR" ? (
        <Controller
          name={`${prefix}CompanyOrgId`}
          control={methods.control}
          render={({ field }) => (
            <>
              <CompanySelectorWrapper
                selectedCompanyOrgId={selectedCompanyOrgId}
                onCompanySelected={company => {
                  if (company) {
                    field.onChange(company.orgId);

                    methods.setValue(`${prefix}CompanyName`, company.name);
                    methods.setValue(
                      `${prefix}CompanyAddress`,
                      company.addressVoie
                    );
                    methods.setValue(
                      `${prefix}CompanyCity`,
                      company.addressCity
                    );
                    methods.setValue(
                      `${prefix}CompanyPostalCode`,
                      company.addressPostalCode
                    );
                    methods.setValue(`${prefix}CompanyCountryCode`, "FR");
                  }
                }}
              />

              {errors?.[`${prefix}CompanyOrgId`] && (
                <Alert
                  description={formatError(errors[`${prefix}CompanyOrgId`])}
                  severity="error"
                  small
                />
              )}
            </>
          )}
        />
      ) : (
        companyType !== "" && (
          <div className="fr-grid-row fr-grid-row--gutters">
            {companyType !== "COMMUNES" && (
              <div className="fr-col-8">
                <Input
                  label="Numéro d'identification"
                  nativeInputProps={{
                    type: "text",
                    ...methods.register(`${prefix}CompanyOrgId`)
                  }}
                  state={errors?.[`${prefix}CompanyOrgId`] && "error"}
                  stateRelatedMessage={formatError(
                    errors?.[`${prefix}CompanyOrgId`]
                  )}
                />
              </div>
            )}
            {!["COMMUNES", "PERSONNE_PHYSIQUE"].includes(companyType) && (
              <div className="fr-col-8">
                <Input
                  label="Raison sociale"
                  nativeInputProps={{
                    type: "text",
                    ...methods.register(`${prefix}CompanyName`)
                  }}
                  state={errors?.[`${prefix}CompanyName`] && "error"}
                  stateRelatedMessage={formatError(
                    errors?.[`${prefix}CompanyName`]
                  )}
                />
              </div>
            )}
            <div className="fr-col-8">
              <Input
                label="Libellé de l'adresse"
                nativeInputProps={{
                  type: "text",
                  ...methods.register(`${prefix}CompanyAddress`)
                }}
                state={errors?.[`${prefix}CompanyAddress`] && "error"}
                stateRelatedMessage={formatError(
                  errors?.[`${prefix}CompanyAddress`]
                )}
              />
            </div>
            <div className="fr-col-4">
              <Input
                label="Code postal"
                nativeInputProps={{
                  type: "number",
                  ...methods.register(`${prefix}CompanyPostalCode`)
                }}
                state={errors?.[`${prefix}CompanyPostalCode`] && "error"}
                stateRelatedMessage={formatError(
                  errors?.[`${prefix}CompanyPostalCode`]
                )}
              />
            </div>
            <div className="fr-col-8">
              <Input
                label="Commune"
                nativeInputProps={{
                  type: "text",
                  ...methods.register(`${prefix}CompanyCity`)
                }}
                state={errors?.[`${prefix}CompanyCity`] && "error"}
                stateRelatedMessage={formatError(
                  errors?.[`${prefix}CompanyCity`]
                )}
              />
            </div>
            <div className="fr-col-4">
              <Input
                label="Code pays"
                nativeInputProps={{
                  type: "text",
                  placeholder: "FR",
                  ...methods.register(`${prefix}CompanyCountryCode`)
                }}
                state={errors?.[`${prefix}CompanyCountryCode`] && "error"}
                stateRelatedMessage={formatError(
                  errors?.[`${prefix}CompanyCountryCode`]
                )}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}
