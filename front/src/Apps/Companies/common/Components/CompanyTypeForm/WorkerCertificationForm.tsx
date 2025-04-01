import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import React from "react";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps,
  CompanyTypeInputValues
} from "./CompanyTypeForm";
import Tooltip from "../../../../common/Components/Tooltip/Tooltip";
import { WORKER_AGREMENT_ORGANISATION_OPTIONS } from "../../utils";

type WorkerCategoryFormProps = {
  inputValues: Pick<CompanyTypeInputValues, "workerCertification">;
  inputProps?: Pick<CompanyTypeInputProps, "workerCertification">;
  inputErrors?: Pick<CompanyTypeInputErrors, "workerCertification">;
};

const WorkerCertificationForm = ({
  inputValues,
  inputProps,
  inputErrors
}: WorkerCategoryFormProps): React.JSX.Element => {
  return (
    <div style={{ paddingTop: "4px" }}>
      <div>
        <div>
          <Checkbox
            options={[
              {
                label: "Travaux relevant de la sous-section 4",
                nativeInputProps: {
                  ...inputProps?.workerCertification?.hasSubSectionFour
                }
              }
            ]}
          />
        </div>
      </div>
      <div>
        <div>
          <Checkbox
            options={[
              {
                label: (
                  <>
                    Travaux relevant de la sous-section 3{" "}
                    <Tooltip
                      className="fr-ml-1w"
                      title="Ce profil correspond à une entreprise disposant d'une certification Amiante (NFX 46-010)"
                    />
                  </>
                ),
                nativeInputProps: {
                  ...inputProps?.workerCertification?.hasSubSectionThree
                }
              }
            ]}
          />
        </div>
      </div>
      {inputValues.workerCertification.hasSubSectionThree && (
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-4">
            <Input
              label="N° certification"
              nativeInputProps={{
                ...inputProps?.workerCertification?.certificationNumber
              }}
              state={
                inputErrors?.workerCertification?.certificationNumber
                  ? "error"
                  : "default"
              }
              stateRelatedMessage={
                inputErrors?.workerCertification?.certificationNumber
              }
            ></Input>
          </div>
          <div className="fr-col-4">
            <Input
              label="Date de validité"
              nativeInputProps={{
                type: "date",
                max: "2999/12/31",
                ...inputProps?.workerCertification?.validityLimit
              }}
              state={
                inputErrors?.workerCertification?.validityLimit
                  ? "error"
                  : "default"
              }
              stateRelatedMessage={
                inputErrors?.workerCertification?.validityLimit
              }
            ></Input>
          </div>
          <div className="fr-col-4">
            <Select
              label="Organisme"
              placeholder="Sélectionner un organisme"
              nativeSelectProps={{
                ...inputProps?.workerCertification?.organisation
              }}
              options={WORKER_AGREMENT_ORGANISATION_OPTIONS}
              state={
                inputErrors?.workerCertification?.organisation
                  ? "error"
                  : "default"
              }
              stateRelatedMessage={
                inputErrors?.workerCertification?.organisation
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(WorkerCertificationForm);
