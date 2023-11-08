import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { formatDate } from "../../../../common/datetime";
import CompanySelector from "../../../common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import { Bsda, BsdaType, CompanySearchPrivate, CompanyType } from "codegen-ui";
import React, { useCallback, useState } from "react";
import initialState from "../initial-state";

export function Worker({ disabled }) {
  const { setFieldValue, values, handleChange } = useFormikContext<Bsda>();

  const isGroupement = values?.type === BsdaType.Gathering;
  const isEntreposageProvisoire = values?.type === BsdaType.Reshipment;
  const isDechetterie = values?.type === BsdaType.Collection_2710;
  const [worker, setWorker] = useState<CompanySearchPrivate>();
  const isWorker = () =>
    worker?.companyTypes?.includes(CompanyType.Worker) ?? false;

  const hasCertification =
    worker?.workerCertification &&
    (worker?.workerCertification.hasSubSectionThree ||
      worker?.workerCertification.hasSubSectionFour);

  const updateWorkerState = useCallback(
    workerSelected => {
      if (workerSelected) {
        setWorker(workerSelected);
        if (workerSelected?.workerCertification) {
          setFieldValue(
            "worker.certification.hasSubSectionFour",
            workerSelected?.workerCertification?.hasSubSectionFour
          );
          setFieldValue(
            "worker.certification.hasSubSectionThree",
            workerSelected?.workerCertification?.hasSubSectionThree
          );
          setFieldValue(
            "worker.certification.certificationNumber",
            workerSelected?.workerCertification?.certificationNumber
          );
          setFieldValue(
            "worker.certification.validityLimit",
            workerSelected?.workerCertification?.validityLimit
          );
          setFieldValue(
            "worker.certification.organisation",
            workerSelected?.workerCertification?.organisation
          );
        } else {
          setFieldValue("worker.certification", null);
        }
      } else {
        setWorker(undefined);
        setFieldValue("worker.certification", null);
      }
    },
    [setFieldValue, setWorker]
  );

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
              setFieldValue("worker.company", initialState.worker.company);
              setFieldValue(
                "worker.certification",
                initialState.worker.certification
              );
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
            onCompanyPrivateInfos={updateWorkerState}
            onCompanySelected={updateWorkerState}
          />
          {worker && (
            <>
              <h4 className="form__section-heading">
                Catégorie entreprise de travaux déclarée dans le profil
                entreprise
              </h4>

              {!isWorker() && (
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

              {isWorker() && !hasCertification && (
                <div className="form__row">
                  {!worker?.workerCertification?.hasSubSectionFour &&
                    !worker?.workerCertification?.hasSubSectionThree && (
                      <Alert
                        title={"L'entreprise n'a pas complété son profil"}
                        severity="warning"
                        description="L'entreprise que vous renseignez s'est enregistrée avec un profil d'entreprise de travaux amiante mais n'a pas complété la catégorie de travaux dans son compte établissement de Trackdéchets. Il appartient à cette entreprise de compléter ses informations."
                      />
                    )}
                </div>
              )}

              <div className="form__row">
                {worker?.workerCertification?.hasSubSectionFour && (
                  <p>
                    SS4 <span aria-hidden> ✅</span>
                  </p>
                )}
              </div>

              <div className="form__row">
                {worker?.workerCertification?.hasSubSectionThree && (
                  <p>
                    SS3 <span aria-hidden> ✅</span> numéro:{" "}
                    {worker?.workerCertification?.certificationNumber} date de
                    validité:{" "}
                    {formatDate(worker?.workerCertification?.validityLimit!)}
                    {" - "}
                    organisme: {worker?.workerCertification?.organisation}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
