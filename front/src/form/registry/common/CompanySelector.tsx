import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

import { capitalize } from "../../../common/helper";
import { formatError } from "../builder/error";
import { InlineAddress } from "./Address";
import { InlineFrenchCompanySelector } from "./FrenchCompanySelector";
import { InlineInseeCodes } from "./InseeCodes";

type Props = {
  prefix: string;
  label: string;
  methods: UseFormReturn<any>;
  excludeTypes?: string[];
  required?: boolean;
  disabled?: boolean;
};

export const COMPANY_TYPES = {
  ETABLISSEMENT_FR: "Etablissement français",
  ENTREPRISE_UE: "Entreprise UE",
  ENTREPRISE_HORS_UE: "Entreprise hors UE",
  ASSOCIATION: "Association",
  PERSONNE_PHYSIQUE: "Personne physique",
  COMMUNES: "Communes"
};

export function CompanySelector({
  prefix,
  label,
  excludeTypes,
  required,
  methods,
  disabled
}: Props) {
  const companyType = methods.watch(
    `${prefix}CompanyType`,
    required ? "ETABLISSEMENT_FR" : ""
  );

  const { errors } = methods.formState;
  const { onChange: onChangeCompanyType, ...typeSelectMethods } =
    methods.register(`${prefix}CompanyType`);

  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-8 fr-mb-2w">
          <Select
            label={capitalize(label)}
            nativeSelectProps={{
              ...typeSelectMethods,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                methods.setValue(`${prefix}CompanyOrgId`, "");
                methods.setValue(`${prefix}CompanyName`, "");
                methods.setValue(`${prefix}CompanyAddress`, "");
                methods.setValue(`${prefix}CompanyCity`, "");
                methods.setValue(`${prefix}CompanyPostalCode`, "");
                methods.setValue(`${prefix}CompanyCountryCode`, "");
                methods.setValue(`${prefix}MunicipalitiesInseeCodes`, []);
                onChangeCompanyType(e);
              }
            }}
            disabled={disabled}
          >
            <option value="">Sélectionnez un type d'acteur</option>
            {Object.entries(COMPANY_TYPES)
              .filter(([key]) => !excludeTypes?.includes(key))
              .map(([key, value]) => (
                <option value={key} key={key}>
                  {value}
                </option>
              ))}
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
        <InlineFrenchCompanySelector
          prefix={prefix}
          methods={methods}
          disabled={disabled}
        />
      ) : (
        companyType !== "" && (
          <div className="fr-grid-row fr-grid-row--gutters">
            {companyType !== "COMMUNES" ? (
              <>
                <div className="fr-col-8">
                  <Input
                    label={
                      companyType === "PERSONNE_PHYSIQUE"
                        ? "Nom et prénom"
                        : "Numéro d'identification"
                    }
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
                {companyType !== "PERSONNE_PHYSIQUE" && (
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
                <InlineAddress prefix={`${prefix}Company`} methods={methods} />
              </>
            ) : (
              <InlineInseeCodes
                methods={methods}
                disabled={disabled}
                prefix={prefix}
              />
            )}
          </div>
        )
      )}
    </div>
  );
}
