import React, { CSSProperties } from "react";
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

const titleStyle: CSSProperties = {
  marginBottom: 12
};

const inputContainerStyle = (isError: boolean): CSSProperties => ({
  display: "flex",
  alignItems: isError ? "center" : "flex-end",
  marginBottom: "1em"
});

const inputStyle: CSSProperties = {
  marginBottom: 0,
  marginRight: "1em",
  minWidth: 400
};

const deleteButtonStyle: CSSProperties = { marginRight: "1em" };

const EcoOrganismeAgrementsForm = ({
  inputValues,
  inputProps,
  inputErrors
}: EcoOrganismeAgrementForm): React.JSX.Element => {
  const { ecoOrganismeAgreements } = inputValues;

  const { value, push, remove } = inputProps?.ecoOrganismeAgreements ?? {};

  return (
    <div>
      <div style={titleStyle}>
        <p className="fr-text--bold">Agréments éco-organisme</p>
      </div>

      {ecoOrganismeAgreements.map((_url, index) => (
        <div
          style={inputContainerStyle(
            Boolean(inputErrors?.ecoOrganismeAgreements?.[index])
          )}
          key={index}
        >
          <Input
            label="URL"
            style={inputStyle}
            nativeInputProps={{
              ...(value && value(index))
            }}
            state={
              inputErrors?.ecoOrganismeAgreements?.[index] ? "error" : "default"
            }
            stateRelatedMessage={inputErrors?.ecoOrganismeAgreements?.[index]}
          />
          <Button
            iconId="ri-delete-bin-fill"
            priority="secondary"
            title="Supprimer"
            style={deleteButtonStyle}
            disabled={ecoOrganismeAgreements.length === 1}
            onClick={e => {
              e.preventDefault();
              if (remove) {
                remove(index);
              }
            }}
          />
          <Button
            iconId="ri-add-line"
            title="Ajouter"
            onClick={e => {
              e.preventDefault();
              if (push) {
                push("");
              }
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default React.memo(EcoOrganismeAgrementsForm);
