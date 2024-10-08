import React from "react";
import { useFormContext } from "react-hook-form";
import Input from "@codegouvfr/react-dsfr/Input";

interface CompanyContactInfoProps {
  fieldName: string;
  disabled?: boolean;
  name?: string;
}

/**
 * Formulaire pour mettre à jour les informations de contact d'un établissement.
 * Utilisé en conjonction avec `CompanySelectorWrapper`, les données
 * peuvent être auto-complétées dès qu'un établissement est sélectionné
 * dans le CompanySelector. Ex :
 *
 * const [_, _, { setValue }] = useField(fieldName)
 * <>
 *  <CompanySelectorWrapper
 *     onCompanySelected={(company) => setValue(...)} // auto-complète les infos
 *  />
 *  <CompanyContactInfo fieldName={fieldName}>
 * <>
 *
 */
export default function CompanyContactInfo({
  fieldName,
  disabled = false,
  name
}: Readonly<CompanyContactInfoProps>) {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Personne à contacter"
            disabled={disabled}
            state={errors?.[`${name}`]?.["company"]?.contact && "error"}
            stateRelatedMessage={
              (errors?.[`${name}`]?.["company"]?.contact?.message as string) ??
              ""
            }
            nativeInputProps={{ ...register(`${fieldName}.contact`) }}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Téléphone"
            disabled={disabled}
            state={errors?.[`${name}`]?.["company"]?.phone && "error"}
            stateRelatedMessage={
              (errors?.[`${name}`]?.["company"]?.phone?.message as string) ?? ""
            }
            nativeInputProps={{ ...register(`${fieldName}.phone`) }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Mail"
            disabled={disabled}
            state={errors?.[`${name}`]?.["company"]?.mail && "error"}
            stateRelatedMessage={
              (errors?.[`${name}`]?.["company"]?.mail?.message as string) ?? ""
            }
            nativeInputProps={{
              ...register(`${fieldName}.mail`),
              type: "email"
            }}
          />
        </div>
      </div>
    </div>
  );
}
