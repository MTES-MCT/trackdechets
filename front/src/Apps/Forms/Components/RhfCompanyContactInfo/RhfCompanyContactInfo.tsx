import React from "react";
import { useFormContext } from "react-hook-form";
import Input from "@codegouvfr/react-dsfr/Input";

interface CompanyContactInfoProps {
  fieldName: string;
  disabled?: boolean;
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
  disabled = false
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
            state={errors?.[`${fieldName}.contact`] && "error"}
            stateRelatedMessage={
              (errors?.[`${fieldName}.contact`]?.message as string) ?? ""
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
            state={errors?.[`${fieldName}.phoneError`] && "error"}
            stateRelatedMessage={
              (errors?.[`${fieldName}.phoneError`]?.message as string) ?? ""
            }
            nativeInputProps={{ ...register(`${fieldName}.phone`) }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Mail"
            disabled={disabled}
            state={errors?.[`${fieldName}.mailError`] && "error"}
            stateRelatedMessage={
              (errors?.[`${fieldName}.mailError`]?.message as string) ?? ""
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
