import React from "react";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps,
  CompanyTypeInputValues
} from "./CompanyTypeForm";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";

type EcoOrganismeAgrementForm = {
  inputValues: Pick<CompanyTypeInputValues, "ecoOrganismeAgreements">;
  inputProps?: Pick<CompanyTypeInputProps, "ecoOrganismeAgreements">;
  inputErrors?: Pick<CompanyTypeInputErrors, "ecoOrganismeAgreements">;
};

const EcoOrganismeAgrementsForm: React.FC<EcoOrganismeAgrementForm> = ({
  inputValues,
  inputProps,
  inputErrors
}) => {
  const { ecoOrganismeAgreements } = inputValues;

  const { value, push, remove } = inputProps?.ecoOrganismeAgreements ?? {};

  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <p className="fr-text--bold">Agréments éco-organisme</p>
        </div>
      </div>

      {ecoOrganismeAgreements.map((_url, index) => (
        <div className="fr-grid-row fr-grid-row--gutters" key="index">
          <div className="fr-col-1">
            <span className="fr-text">URL</span>
          </div>
          <div className="fr-col-8">
            <Input
              label=""
              nativeInputProps={{
                type: "text",
                placeholder: "https://",
                ...(value && value(index))
              }}
              state={
                inputErrors?.ecoOrganismeAgreements?.[index]
                  ? "error"
                  : "default"
              }
              stateRelatedMessage={inputErrors?.ecoOrganismeAgreements?.[index]}
            />
          </div>
          <div className="fr-col-3">
            <Button
              iconId="ri-delete-bin-line"
              disabled={index === 0}
              onClick={() => {
                if (remove) {
                  remove(index);
                }
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      ))}
      <div className="fr-grid-row fr-pt-1w">
        <div className="fr-col-12">
          <Button
            iconId="ri-add-line"
            onClick={e => {
              e.preventDefault();
              if (push) {
                push("");
              }
            }}
          >
            Ajouter un agrément
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EcoOrganismeAgrementsForm);
