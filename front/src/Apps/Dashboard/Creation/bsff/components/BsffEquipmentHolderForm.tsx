import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import {
  requiredAria,
  requiredLabel
} from "../../../../Forms/Components/RequiredField/requiredField";

export const EQUIPMENT_HOLDER_TYPES = [
  { value: "ENTREPRISE", label: "Entreprise" },
  { value: "PARTICULIER", label: "Particulier" },
  { value: "ASSOCIATION", label: "Association" },
  { value: "NAVIRE", label: "Navire" }
] as const;

type Props = {
  fieldName: string;
  orgId?: string;
  disabled?: boolean;
  showInterventionSection?: boolean;
};

export function BsffEquipmentHolderForm({
  fieldName,
  orgId,
  disabled = false,
  showInterventionSection = false
}: Props) {
  const { register, watch, setValue, formState } = useFormContext();
  const [selectedPackaging, setSelectedPackaging] = useState("");
  const holderType = watch(`${fieldName}.holderType`);
  const isExempted = !!watch(`${fieldName}.isExempted`);
  const packagings = watch("packagings") ?? [];
  const linkedPackagings = watch(`${fieldName}.packagings`) ?? [];
  const companyField = `${fieldName}.detenteur.company`;
  const errors: any = formState.errors;
  const holderErrors = fieldName
    .split(".")
    .reduce((value, key) => value?.[key], errors);

  const availablePackagings = packagings.filter(
    packaging =>
      packaging.numero &&
      !linkedPackagings.some(linked => linked.numero === packaging.numero)
  );
  const identificationLabel =
    holderType === "ENTREPRISE"
      ? "Identification (SIRET ou raison sociale)"
      : holderType === "ASSOCIATION"
      ? "N° d'inscription au registre national des associations"
      : "N° Organisation Maritime Internationale";

  const requiredProps = { required: true, "aria-required": true } as const;

  return (
    <div className="fr-col-12">
      {showInterventionSection && (
        <>
          <h4 className="fr-mt-4w">Fiche d’intervention</h4>
          <ToggleSwitch
            label="Équipement exempté de fiche d’intervention au sens de l’article R. 543-82 du code de l’environnement"
            inputTitle="Exemption de fiche d’intervention"
            checked={isExempted}
            disabled={disabled}
            onChange={checked =>
              setValue(`${fieldName}.isExempted`, checked, {
                shouldDirty: true,
                shouldValidate: true
              })
            }
          />
          <Input
            className="fr-mt-3w"
            label={requiredLabel("N° de fiche d’intervention", !isExempted)}
            disabled={disabled}
            state={holderErrors?.numero ? "error" : "default"}
            stateRelatedMessage={holderErrors?.numero?.message}
            nativeInputProps={{
              ...register(`${fieldName}.numero`),
              required: !isExempted,
              ...requiredAria(!isExempted)
            }}
          />
        </>
      )}
      <h4 className="fr-mt-4w">Détenteur</h4>
      <Select
        label="Type de détenteur *"
        disabled={disabled}
        state={holderErrors?.holderType ? "error" : "default"}
        stateRelatedMessage={holderErrors?.holderType?.message}
        nativeSelectProps={{
          ...register(`${fieldName}.holderType`, {
            onChange: () => {
              setValue(`${fieldName}.identification`, "");
              setValue(companyField, {});
            }
          }),
          ...requiredProps
        }}
      >
        <option value="">Sélectionner une option</option>
        {EQUIPMENT_HOLDER_TYPES.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {holderType === "ENTREPRISE" && (
        <>
          <CompanySelectorWrapper
            orgId={orgId}
            disabled={disabled}
            searchRequired
            selectedCompanyOrgId={
              watch(`${companyField}.orgId`) ?? watch(`${companyField}.siret`)
            }
            onCompanySelected={company => {
              if (!company) return;
              setValue(
                companyField,
                {
                  orgId: company.orgId,
                  siret: company.siret,
                  name: company.name ?? "",
                  address: company.address ?? "",
                  contact: company.contact ?? "",
                  phone: company.contactPhone ?? "",
                  mail: company.contactEmail ?? ""
                },
                { shouldDirty: true, shouldValidate: true }
              );
            }}
          />
          {holderErrors?.identification?.message && (
            <p className="fr-error-text">
              {holderErrors.identification.message}
            </p>
          )}
        </>
      )}

      {holderType &&
        holderType !== "PARTICULIER" &&
        holderType !== "ENTREPRISE" && (
          <Input
            label={`${identificationLabel} *`}
            disabled={disabled}
            state={holderErrors?.identification ? "error" : "default"}
            stateRelatedMessage={holderErrors?.identification?.message}
            nativeInputProps={{
              ...register(`${fieldName}.identification`),
              ...requiredProps
            }}
          />
        )}

      {holderType && (
        <>
          <Input
            label="Personne à contacter *"
            disabled={disabled}
            state={
              holderErrors?.detenteur?.company?.contact ? "error" : "default"
            }
            stateRelatedMessage={
              holderErrors?.detenteur?.company?.contact?.message
            }
            nativeInputProps={{
              ...register(`${companyField}.contact`),
              ...requiredProps
            }}
          />
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-6">
              <Input
                label="Téléphone *"
                disabled={disabled}
                state={
                  holderErrors?.detenteur?.company?.phone ? "error" : "default"
                }
                stateRelatedMessage={
                  holderErrors?.detenteur?.company?.phone?.message
                }
                nativeInputProps={{
                  ...register(`${companyField}.phone`),
                  ...requiredProps
                }}
              />
            </div>
            <div className="fr-col-md-6">
              <Input
                label="Courriel *"
                disabled={disabled}
                state={
                  holderErrors?.detenteur?.company?.mail ? "error" : "default"
                }
                stateRelatedMessage={
                  holderErrors?.detenteur?.company?.mail?.message
                }
                nativeInputProps={{
                  type: "email",
                  ...register(`${companyField}.mail`),
                  ...requiredProps
                }}
              />
            </div>
          </div>

          <label
            className="fr-label fr-mt-2w"
            htmlFor={`${fieldName}-packaging`}
          >
            Contenants rattachés *
          </label>
          <div className="fr-grid-row">
            <select
              id={`${fieldName}-packaging`}
              className="fr-select fr-col"
              value={selectedPackaging}
              disabled={disabled || availablePackagings.length === 0}
              aria-required="true"
              onChange={event => setSelectedPackaging(event.target.value)}
            >
              <option value="">Sélectionner un contenant</option>
              {availablePackagings.map(packaging => (
                <option key={packaging.numero} value={packaging.numero}>
                  {packaging.numero}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="fr-btn"
              disabled={disabled || !selectedPackaging}
              onClick={() => {
                const packaging = packagings.find(
                  item => item.numero === selectedPackaging
                );
                if (!packaging) return;
                setValue(
                  `${fieldName}.packagings`,
                  [
                    ...linkedPackagings,
                    { id: packaging.id, numero: packaging.numero }
                  ],
                  { shouldDirty: true, shouldValidate: true }
                );
                setSelectedPackaging("");
              }}
            >
              Ajouter
            </button>
          </div>
          {holderErrors?.packagings?.message && (
            <p className="fr-error-text">{holderErrors.packagings.message}</p>
          )}
          <div className="fr-mt-1w">
            {linkedPackagings.map(packaging => (
              <button
                key={packaging.numero}
                type="button"
                className="fr-tag fr-tag--dismiss fr-mr-1w"
                disabled={disabled}
                onClick={() =>
                  setValue(
                    `${fieldName}.packagings`,
                    linkedPackagings.filter(
                      linked => linked.numero !== packaging.numero
                    ),
                    { shouldDirty: true, shouldValidate: true }
                  )
                }
              >
                {packaging.numero}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
