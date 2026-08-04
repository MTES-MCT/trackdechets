import React from "react";
import { useFormContext } from "react-hook-form";
import Input from "@codegouvfr/react-dsfr/Input";
import { requiredAria, requiredLabel } from "../RequiredField/requiredField";

interface CompanyContactInfoProps {
  fieldName: string;
  disabled?: boolean;
  required?: boolean;
  requiredMarkers?: boolean;
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
  requiredMarkers,
  errorObject
}: Readonly<CompanyContactInfoProps>) {
  const { register } = useFormContext();

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={requiredLabel("Personne à contacter", !!requiredMarkers)}
            disabled={disabled}
            state={errorObject?.contact && "error"}
            stateRelatedMessage={
              (errorObject?.contact?.message as string) ?? ""
            }
            nativeInputProps={{
              "aria-required": true,
              ...register(
                `${fieldName}.contact`,
                required ? { required: "Champ requis" } : {}
              ),
              ...(requiredMarkers === undefined
                ? {}
                : requiredAria(requiredMarkers))
            }}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={requiredLabel("Téléphone", !!requiredMarkers)}
            disabled={disabled}
            state={errorObject?.phone && "error"}
            stateRelatedMessage={(errorObject?.phone?.message as string) ?? ""}
            nativeInputProps={{
              "aria-required": true,
              ...register(
                `${fieldName}.phone`,
                required ? { required: "Champ requis" } : {}
              ),
              ...(requiredMarkers === undefined
                ? {}
                : requiredAria(requiredMarkers))
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={requiredLabel("Courriel", !!requiredMarkers)}
            disabled={disabled}
            state={errorObject?.mail && "error"}
            stateRelatedMessage={(errorObject?.mail?.message as string) ?? ""}
            nativeInputProps={{
              "aria-required": true,
              ...register(
                `${fieldName}.mail`,
                required ? { required: "Champ requis" } : {}
              ),
              type: "email",
              ...(requiredMarkers === undefined
                ? {}
                : requiredAria(requiredMarkers))
            }}
          />
        </div>
      </div>
    </div>
  );
}
