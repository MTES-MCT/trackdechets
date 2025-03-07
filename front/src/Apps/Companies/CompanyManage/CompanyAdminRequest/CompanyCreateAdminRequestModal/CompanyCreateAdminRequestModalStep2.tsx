import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";
import { useFormContext } from "react-hook-form";

export enum AdminRequestValidationMethod {
  REQUEST_ADMIN_APPROVAL = "REQUEST_ADMIN_APPROVAL",
  REQUEST_COLLABORATOR_APPROVAL = "REQUEST_COLLABORATOR_APPROVAL",
  SEND_MAIL = "SEND_MAIL"
}

export const CompanyCreateAdminRequestModalStep2 = () => {
  const { register, watch } = useFormContext();

  const validationMethod = watch("validationMethod");

  return (
    <>
      <RadioButtons
        className="fr-col-sm-10"
        options={[
          {
            label: "Demander aux administrateurs",
            nativeInputProps: {
              value: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL,
              ...register("validationMethod")
            }
          },
          {
            label:
              "Demander à un autre collaborateur. Les administrateurs sont inactifs.",
            nativeInputProps: {
              value: AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
              ...register("validationMethod")
            }
          },
          {
            label:
              "Envoyer un courrier. L'établissement n'a plus d'administrateurs actifs ou de collaborateurs pouvant confirmer la demande.",
            nativeInputProps: {
              value: AdminRequestValidationMethod.SEND_MAIL,
              ...register("validationMethod")
            }
          }
        ]}
        // state={formState.errors?.identification?.type && "error"}
        // stateRelatedMessage={
        //   formState.errors?.identification?.type?.["message"]
        // }
      />

      {validationMethod === AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL && (
        <Input
          label="Courriel du collaborateur"
          nativeInputProps={{
            required: true,
            ...register("collaboratorEmail")
          }}
        />
      )}
    </>
  );
};
