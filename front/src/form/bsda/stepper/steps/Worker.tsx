import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { formatDate } from "common/datetime";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import {
  Bsda,
  BsdaType,
  CompanyType,
  Maybe,
  WorkerCertification,
} from "generated/graphql/types";
import React, { useState } from "react";
import initialState from "../initial-state";

export function Worker({ disabled }) {
  const { setFieldValue, values, handleChange } = useFormikContext<Bsda>();

  const isGroupement = values?.type === BsdaType.Gathering;
  const isEntreposageProvisoire = values?.type === BsdaType.Reshipment;
  const isDechetterie = values?.type === BsdaType.Collection_2710;
  const [workerCertification, setWorkerCertification] =
    useState<Maybe<WorkerCertification>>();

  const [isWorker, setIsWorker] = useState<boolean>(false);
  const showWorkerCertification = !!workerCertification || !isWorker;

  const hasCertification =
    workerCertification &&
    (workerCertification.hasSubSectionThree ||
      workerCertification.hasSubSectionFour);

  if (isGroupement || isEntreposageProvisoire || isDechetterie) {
    return (
      <div className="notification">
        Vous effectuez un groupement, une réexpédition ou une collecte en
        déchetterie. Il n'y a pas d'entreprise de travaux à saisir.
      </div>
    );
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <div className="form__row">
        <label>
          <Field
            disabled={disabled}
            type="checkbox"
            name="worker.isDisabled"
            className="td-checkbox"
            onChange={e => {
              handleChange(e);
              setFieldValue("worker", initialState.worker);
            }}
          />
          Il n'y a pas d'entreprise de travaux
        </label>
      </div>

      {!Boolean(values?.worker?.isDisabled) && (
        <>
          <CompanySelector
            disabled={disabled}
            name="worker.company"
            heading="Entreprise de travaux"
            onCompanyPrivateInfos={worker => {
              if (worker) {
                setIsWorker(
                  worker.companyTypes?.includes(CompanyType.Worker) ?? false
                );
                setWorkerCertification(worker?.workerCertification);
                setFieldValue(
                  "worker.certification.hasSubSectionFour",
                  worker?.workerCertification?.hasSubSectionFour
                );
                setFieldValue(
                  "worker.certification.hasSubSectionThree",
                  worker?.workerCertification?.hasSubSectionThree
                );
                setFieldValue(
                  "worker.certification.certificationNumber",
                  worker?.workerCertification?.certificationNumber
                );
                setFieldValue(
                  "worker.certification.validityLimit",
                  worker?.workerCertification?.validityLimit
                );
                setFieldValue(
                  "worker.certification.organisation",
                  worker?.workerCertification?.organisation
                );
              } else {
                setIsWorker(false);
                setWorkerCertification(null);
                setFieldValue(
                  "worker.certification",
                  initialState.worker.certification
                );
              }
            }}
          />
          {showWorkerCertification && (
            <>
              <h4 className="form__section-heading">
                Catégorie entreprise de travaux déclarée dans le profil
                entreprise
              </h4>

              {!isWorker && (
                <div>
                  <Alert
                    title={
                      "L'entreprise n'est pas une entreprise de travaux amiante"
                    }
                    severity="error"
                    description="L'entreprise que vous renseignez ne s'est pas enregistrée avec un profil d'entreprise de travaux amiante ou n'a pas complété la catégorie de travaux dans son compte établissement de Trackdéchets. Il appartient à cette entreprise de compléter ses informations"
                  />
                </div>
              )}

              {isWorker && !hasCertification && (
                <div className="form__row">
                  {!workerCertification?.hasSubSectionFour &&
                    !workerCertification?.hasSubSectionThree && (
                      <Alert
                        title={"L'entreprise n'a pas complété son profil"}
                        severity="warning"
                        description="L'entreprise que vous renseignez s'est enregistrée avec un profil d'entreprise de travaux amiante mais n'a pas complété la catégorie de travaux dans son compte établissement de Trackdéchets. Il appartient à cette entreprise de compléter ses informations."
                      />
                    )}
                </div>
              )}

              <div className="form__row">
                {workerCertification?.hasSubSectionFour && (
                  <>
                    <p>
                      SS4 <span aria-hidden> ✅</span>
                    </p>
                  </>
                )}
              </div>

              <div className="form__row">
                {workerCertification?.hasSubSectionThree && (
                  <>
                    <p>
                      SS3 <span aria-hidden> ✅</span> numéro:{" "}
                      {workerCertification?.certificationNumber} date de
                      validité:{" "}
                      {formatDate(workerCertification?.validityLimit!)}
                      {" - "}
                      organisme: {workerCertification?.organisation}
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
