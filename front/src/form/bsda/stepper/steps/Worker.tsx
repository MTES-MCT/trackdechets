import { formatDate } from "common/datetime";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import { Bsda, BsdaType } from "generated/graphql/types";
import React from "react";
import initialState from "../initial-state";

export function Worker({ disabled }) {
  const { setFieldValue, values, handleChange } = useFormikContext<Bsda>();

  const isGroupement = values?.type === BsdaType.Gathering;
  const isEntreposageProvisoire = values?.type === BsdaType.Reshipment;
  const isDechetterie = values?.type === BsdaType.Collection_2710;

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
              setFieldValue("worker.company.name", null);
              setFieldValue("worker.company.siret", null);
              setFieldValue("worker.company.contact", null);
              setFieldValue("worker.company.address", null);
              setFieldValue("worker.company.mail", null);
              setFieldValue("worker.company.phone", null);
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
            onCompanySelected={worker => {
              if (worker.workerCertification?.hasSubSectionFour) {
                setFieldValue(
                  "worker.certification.hasSubSectionFour",
                  worker.workerCertification.hasSubSectionFour
                );
              } else {
                setFieldValue("worker.certification.hasSubSectionFour", false);
              }

              if (worker.workerCertification?.hasSubSectionThree) {
                setFieldValue(
                  "worker.certification.hasSubSectionThree",
                  worker.workerCertification.hasSubSectionThree
                );
                setFieldValue(
                  "worker.certification.certificationNumber",
                  worker.workerCertification.certificationNumber
                );
                setFieldValue(
                  "worker.certification.validityLimit",
                  worker.workerCertification.validityLimit
                );
                setFieldValue(
                  "worker.certification.organisation",
                  worker.workerCertification.organisation
                );
              } else {
                setFieldValue("worker.certification.hasSubSectionThree", false);
                setFieldValue(
                  "worker.certification.certificationNumber",
                  initialState.worker.certification.validityLimit
                );
                setFieldValue(
                  "worker.certification.validityLimit",
                  initialState.worker.certification.validityLimit
                );
                setFieldValue(
                  "worker.certification.organisation",
                  initialState.worker.certification.organisation
                );
              }
            }}
          />

          <h4 className="form__section-heading">
            Certification déclarée dans le profil entreprise
          </h4>

          <div className="form__row">
            {!values?.worker?.certification?.hasSubSectionFour &&
              !values?.worker?.certification?.hasSubSectionThree && (
                <p>
                  Absence de certification déclarée dans le profil. Il
                  appartient à l'entreprise de travaux de le mettre à jour le
                  cas échéant
                </p>
              )}
          </div>

          <div className="form__row">
            {values?.worker?.certification?.hasSubSectionFour && (
              <>
                <p>
                  SS4 <span aria-hidden> ✅</span>
                </p>
              </>
            )}
          </div>

          <div className="form__row">
            {values?.worker?.certification?.hasSubSectionThree && (
              <>
                <p>
                  SS3 <span aria-hidden> ✅</span> numéro:{" "}
                  {values?.worker?.certification?.certificationNumber} date de
                  validité:{" "}
                  {formatDate(values?.worker?.certification?.validityLimit!)}
                  {" - "}
                  organisme: {values?.worker?.certification?.organisation}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
