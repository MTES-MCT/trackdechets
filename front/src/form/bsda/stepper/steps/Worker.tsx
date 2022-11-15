import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
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
            Catégorie entreprise de travaux amiante
          </h4>

          <div className="form__row">
            <label>
              <Field
                disabled={disabled}
                type="checkbox"
                name="worker.certification.hasSubSectionFour"
                className="td-checkbox"
              />
              Entreprise de travaux déclarée Sous-section 4
            </label>
          </div>

          <div className="form__row">
            <label>
              <Field
                disabled={disabled}
                type="checkbox"
                name="worker.certification.hasSubSectionThree"
                className="td-checkbox"
              />
              Entreprise de travaux déclarée Sous-section 3
            </label>
          </div>

          {values?.worker?.certification?.hasSubSectionThree && (
            <>
              <div className="form__row">
                <label>
                  Numéro de certification
                  <Field
                    type="text"
                    name="worker.certification.certificationNumber"
                    className="td-input td-input--medium"
                  />
                </label>
              </div>
              <div className="form__row">
                <label>
                  Limite de validité
                  <Field
                    component={DateInput}
                    name="worker.certification.validityLimit"
                    className="td-input td-input--small"
                    disabled={disabled}
                  />
                </label>
              </div>
              <div className="form__row">
                <label>
                  Organisme
                  <Field
                    as="select"
                    name="worker.certification.organisation"
                    className="td-select"
                  >
                    <option value="...">Sélectionnez une valeur...</option>
                    <option value="AFNOR Certification">
                      AFNOR Certification
                    </option>
                    <option value="GLOBAL CERTIFICATION">
                      GLOBAL CERTIFICATION
                    </option>
                    <option value="QUALIBAT">QUALIBAT</option>
                  </Field>
                </label>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
