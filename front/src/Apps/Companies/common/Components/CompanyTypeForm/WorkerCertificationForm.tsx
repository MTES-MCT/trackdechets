import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import React from "react";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps,
  CompanyTypeInputValues
} from "./CompanyTypeForm";
import Tooltip from "../../../../../common/components/Tooltip";
import { WORKER_AGREMENT_ORGANISATION_OPTIONS } from "../../utils";

type WorkerCategoryFormProps = {
  inputValues: Pick<CompanyTypeInputValues, "workerCertification">;
  inputProps?: Pick<CompanyTypeInputProps, "workerCertification">;
  inputErrors?: Pick<CompanyTypeInputErrors, "workerCertification">;
};

const WorkerCertificationForm: React.FC<WorkerCategoryFormProps> = ({
  inputValues,
  inputProps,
  inputErrors
}) => {
  return (
    <div className="fr-container" style={{ paddingTop: "4px" }}>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
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
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-6">
          <Checkbox
            options={[
              {
                label: "Travaux relevant de la sous-section 3",
                nativeInputProps: {
                  ...inputProps?.workerCertification?.hasSubSectionThree
                }
              }
            ]}
          />
        </div>
        <div className="fr-col-1">
          <Tooltip msg="Ce profil correspond à une entreprise disposant d'une certification Amiante (NFX 46-010)" />
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

            {/* <RedErrorMessage name="certificationNumber" /> */}
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

            {/* <RedErrorMessage name="validityLimit" /> */}
          </div>
          <div className="fr-col-4">
            <Select
              label="Organisme"
              placeholder="Organisme"
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
            {/* <RedErrorMessage name="organisation" /> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(WorkerCertificationForm);
