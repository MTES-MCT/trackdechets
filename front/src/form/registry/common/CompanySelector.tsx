import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Input } from "@codegouvfr/react-dsfr/Input";
import CompanySelectorWrapper from "../../../Apps/common/Components/CompanySelectorWrapper/CompanySelectorWrapper";

type Props = {
  prefix: string;
  label: string;
  methods: UseFormReturn<any>;
};

const TYPES = {
  ETABLISSEMENT_FR: "Etablissement français",
  ENTREPRISE_UE: "Entreprise UE",
  ENTREPRISE_HORS_UE: "Entreprise hors UE",
  ASSOCIATION: "Association",
  PERSONNE_PHYSIQUE: "Personne physique"
};

export function CompanySelector({ prefix, label, methods }: Props) {
  const companyType = methods.watch(`${prefix}CompanyType`, "ETABLISSEMENT_FR");
  const selectedCompanyOrgId = methods.watch(`${prefix}CompanyOrgId`);

  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-8 fr-mb-2w">
          <Select
            label={`Type de ${label}`}
            nativeSelectProps={{
              ...methods.register(`${prefix}CompanyType`, {
                required: true
              })
            }}
          >
            {Object.entries(TYPES).map(([key, value]) => (
              <option value={key} key={key}>
                {value}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {companyType === "ETABLISSEMENT_FR" ? (
        <CompanySelectorWrapper
          selectedCompanyOrgId={selectedCompanyOrgId}
          onCompanySelected={company => {
            if (company) {
              methods.setValue(`${prefix}CompanyOrgId`, company.orgId);
              methods.setValue(`${prefix}CompanyName`, company.name);
              methods.setValue(`${prefix}CompanyAddress`, company.addressVoie);
              methods.setValue(`${prefix}CompanyCity`, company.addressCity);
              methods.setValue(
                `${prefix}CompanyPostalCode`,
                company.addressPostalCode
              );
              methods.setValue(`${prefix}CompanyCountryCode`, "FR");
            }
          }}
        />
      ) : (
        <div className="fr-grid-row fr-grid-row--gutters">
          {companyType !== "COMMUNES" && (
            <div className="fr-col-8">
              <Input
                label="Numéro d'identification"
                nativeInputProps={{
                  type: "text",
                  ...methods.register(`${prefix}CompanyOrgId`)
                }}
              />
            </div>
          )}
          {!["COMMUNES", "PERSONNE_PHYSIQUE"].includes(companyType) && (
            <div className="fr-col-8">
              <Input
                label="Raison sociale"
                nativeInputProps={{
                  type: "text",
                  ...methods.register(`${prefix}CompanyOrgId`)
                }}
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
            />
          </div>
          <div className="fr-col-4">
            <Input
              label="Code postal"
              nativeInputProps={{
                type: "number",
                ...methods.register(`${prefix}CompanyPostalCode`)
              }}
            />
          </div>
          <div className="fr-col-8">
            <Input
              label="Commune"
              nativeInputProps={{
                type: "text",
                ...methods.register(`${prefix}CompanyPostalCity`)
              }}
            />
          </div>
          <div className="fr-col-4">
            <Input
              label="Code pays"
              nativeInputProps={{
                type: "text",
                placeholder: "FR",
                ...methods.register(`${prefix}CompanyPostalCountry`)
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
