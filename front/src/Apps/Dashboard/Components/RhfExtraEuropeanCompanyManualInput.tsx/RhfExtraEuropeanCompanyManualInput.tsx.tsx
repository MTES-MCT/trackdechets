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
      <h4 className="h4">Entreprise extra-européenne</h4>

      <Input
        label="Identifiant de l'entreprise"
        hintText="À renseigner si numéro de TVA inexistant"
        className="fr-col-12"
        nativeInputProps={{
          value: extraEuropeanCompanyId!,
          onChange: e => onExtraEuropeanCompanyId(e.target.value)
        }}
      />

      <Input
        label="Numéro de TVA (optionnel)"
        hintText="À renseigner si le numéro de TVA n'est pas reconnu dans le champ de recherche"
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
          required: !optional,
          placeholder: "Adresse"
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
          required: !optional,
          placeholder: "NOM Prénom"
        }}
      />

      <Input
        label="Téléphone ou Fax"
        className="fr-col-12"
        state={errorObject?.phone && "error"}
        stateRelatedMessage={(errorObject?.phone?.message as string) ?? ""}
        nativeInputProps={{
          ...register(`${fieldName}.phone`),
          required: !optional,
          placeholder: "Numéro"
        }}
      />

      <Input
        label="Adresse e-mail"
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
