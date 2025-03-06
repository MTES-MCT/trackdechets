import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";

const options = [
  {
    label: "Demander aux administrateurs",
    nativeInputProps: {
      // ...register("identification.type"),
      value: "ASK_ADMIN"
    }
  },
  {
    label:
      "Demander à un autre collaborateur. Les administrateurs sont inactifs.",
    nativeInputProps: {
      // ...register("identification.type"),
      value: "ASK_COLLEAGUE"
    }
  },
  {
    label:
      "Envoyer un courrier. L'établissement n'a plus d'administrateurs actifs ou de collaborateurs pouvant confirmer la demande.",
    nativeInputProps: {
      // ...register("identification.type"),
      value: "SEND_MAIL"
    }
  }
];

export const CompanyCreateAdminRequestModalStep2 = () => {
  return (
    <>
      <RadioButtons
        className="fr-col-sm-10"
        options={options}
        // state={formState.errors?.identification?.type && "error"}
        // stateRelatedMessage={
        //   formState.errors?.identification?.type?.["message"]
        // }
      />
      <Input
        label="Courriel du collaborateur"
        // disabled={disabled}
        // state={errorObject?.contact && "error"}
        // stateRelatedMessage={
        //   (errorObject?.contact?.message as string) ?? ""
        // }
        // nativeInputProps={{
        //   ...register(
        //     `${fieldName}.contact`,
        //     required ? { required: "Champ requis" } : {}
        //   )
        // }}
      />
    </>
  );
};
