import React from "react";
import { useFormContext } from "react-hook-form";
import RhfCountrySelector from "./RhfCountrySelector";
import Input from "@codegouvfr/react-dsfr/Input";

interface RhfExtraEuropeanCompanyManualInputProps {
  fieldName: string;
  optional: boolean;
  extraEuropeanCompanyId?: string | null;
  onExtraEuropeanCompanyId: (value: string) => void;
  errorObject?: any;
}

export default function RhfExtraEuropeanCompanyManualInput({
  fieldName,
  optional,
  extraEuropeanCompanyId,
  onExtraEuropeanCompanyId,
  errorObject
}: RhfExtraEuropeanCompanyManualInputProps) {
  const { register } = useFormContext();

  return (
    <div>
      <h6 className="fr-h6">Entreprise extra-européenne</h6>

      <Input
        label="Identifiant de l'entreprise"
        hintText="Si l'entreprise est située hors Union Européenne et qu'elle n'a pas de numéro de TVA"
        className="fr-col-12"
        nativeInputProps={{
          value: extraEuropeanCompanyId!,
          onChange: e => onExtraEuropeanCompanyId(e.target.value)
        }}
      />

      <Input
        label="Numéro de TVA (optionnel)"
        hintText="Si le numéro de TVA n'a pas été reconnu dans le champ de recherche"
        className="fr-col-12"
        state={errorObject?.vatNumber && "error"}
        stateRelatedMessage={(errorObject?.vatNumber?.message as string) ?? ""}
        nativeInputProps={{
          ...register(`${fieldName}.vatNumber`)
        }}
      />

      <Input
        label="Nom de l'entreprise"
        className="fr-col-12"
        state={errorObject?.name && "error"}
        stateRelatedMessage={(errorObject?.name?.message as string) ?? ""}
        nativeInputProps={{
          ...register(`${fieldName}.name`),
          required: !optional
        }}
      />

      <Input
        label="Adresse de l'entreprise"
        className="fr-col-12"
        state={errorObject?.address && "error"}
        stateRelatedMessage={(errorObject?.address?.message as string) ?? ""}
        nativeInputProps={{
          ...register(`${fieldName}.address`),
          required: !optional
        }}
      />

      <RhfCountrySelector
        label="Pays de l'entreprise"
        fieldName={`${fieldName}.country`}
        errorObject={errorObject?.address}
        cca2sToExclude={["FR"]}
      />

      <Input
        label="Personne à contacter"
        className="fr-col-12"
        state={errorObject?.contact && "error"}
        stateRelatedMessage={(errorObject?.contact?.message as string) ?? ""}
        nativeInputProps={{
          ...register(`${fieldName}.contact`),
          required: !optional
        }}
      />

      <Input
        label="Téléphone ou Fax"
        className="fr-col-12"
        state={errorObject?.phone && "error"}
        stateRelatedMessage={(errorObject?.phone?.message as string) ?? ""}
        nativeInputProps={{
          ...register(`${fieldName}.phone`),
          required: !optional
        }}
      />

      <Input
        label="Courriel"
        className="fr-col-12"
        state={errorObject?.mail && "error"}
        stateRelatedMessage={(errorObject?.mail?.message as string) ?? ""}
        nativeInputProps={{
          ...register(`${fieldName}.mail`),
          required: !optional,
          type: "email"
        }}
      />
    </div>
  );
}
