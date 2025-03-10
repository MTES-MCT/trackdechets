import Input from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";
import { useFormContext } from "react-hook-form";
import { isDefined } from "../../../../../common/helper";
import { isEmail } from "@td/constants";
import { AdminRequestValidationMethod } from "@td/codegen-ui";

export const CompanyCreateAdminRequestModalStep2 = ({
  onClickNext,
  onClickPrevious
}) => {
  const { register, watch } = useFormContext();

  const validationMethod = watch("validationMethod");
  const collaboratorEmail = watch("collaboratorEmail");
  const companyName = watch("companyName");
  const companyOrgId = watch("companyOrgId");

  return (
    <>
      <div className="fr-mb-2w">
        <ul className="fr-ml-2w" style={{ listStyleType: "disc" }}>
          {companyName && companyOrgId && (
            <li>
              Établissement concerné: {companyName} - {companyOrgId}
            </li>
          )}
        </ul>
      </div>

      <div>
        <RadioButtons
          className="fr-col-sm-10"
          options={[
            {
              label: "Demander aux administrateurs",
              nativeInputProps: {
                value: AdminRequestValidationMethod.RequestAdminApproval,
                ...register("validationMethod")
              }
            },
            {
              label:
                "Demander à un autre collaborateur. Les administrateurs sont inactifs.",
              nativeInputProps: {
                value: AdminRequestValidationMethod.RequestCollaboratorApproval,
                ...register("validationMethod")
              }
            },
            {
              label:
                "Envoyer un courrier. L'établissement n'a plus d'administrateurs actifs ou de collaborateurs pouvant confirmer la demande.",
              nativeInputProps: {
                value: AdminRequestValidationMethod.SendMail,
                ...register("validationMethod")
              }
            }
          ]}
        />

        {validationMethod ===
          AdminRequestValidationMethod.RequestCollaboratorApproval && (
          <Input
            label="Courriel du collaborateur"
            nativeInputProps={{
              type: "email",
              required: true,
              ...register("collaboratorEmail")
            }}
          />
        )}
      </div>

      <div className="td-modal-actions">
        <button className="fr-btn" onClick={onClickPrevious}>
          Retour
        </button>

        <button
          className="fr-btn"
          disabled={
            !isDefined(validationMethod) ||
            (validationMethod ===
              AdminRequestValidationMethod.RequestCollaboratorApproval &&
              !isEmail(collaboratorEmail))
          }
          onClick={onClickNext}
        >
          Suivant
        </button>
      </div>
    </>
  );
};
