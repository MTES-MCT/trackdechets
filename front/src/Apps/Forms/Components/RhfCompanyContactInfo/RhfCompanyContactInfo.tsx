import React from "react";
import { useFormContext } from "react-hook-form";
import Input from "@codegouvfr/react-dsfr/Input";

interface CompanyContactInfoProps {
  fieldName: string;
  disabled?: boolean;
  required?: boolean;
  errorObject?: any;
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
 * Attention : errorObject représente l'objet Zod contenant l'erreur et le message
 * et doit être fourni par le parent
 */
export default function CompanyContactInfo({
  fieldName,
  disabled = false,
  required = false,
  errorObject
}: Readonly<CompanyContactInfoProps>) {
  const { register } = useFormContext();

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Personne à contacter"
            disabled={disabled}
            state={errorObject?.contact && "error"}
            stateRelatedMessage={
              (errorObject?.contact?.message as string) ?? ""
            }
            nativeInputProps={{
              ...register(
                `${fieldName}.contact`,
                required ? { required: "Champ requis" } : {}
              )
            }}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Téléphone"
            disabled={disabled}
            state={errorObject?.phone && "error"}
            stateRelatedMessage={(errorObject?.phone?.message as string) ?? ""}
            nativeInputProps={{
              ...register(
                `${fieldName}.phone`,
                required ? { required: "Champ requis" } : {}
              )
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Mail"
            disabled={disabled}
            state={errorObject?.mail && "error"}
            stateRelatedMessage={(errorObject?.mail?.message as string) ?? ""}
            nativeInputProps={{
              ...register(
                `${fieldName}.mail`,
                required ? { required: "Champ requis" } : {}
              ),
              type: "email"
            }}
          />
        </div>
      </div>
    </div>
  );
}
