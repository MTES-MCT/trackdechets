import React from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsda, BsdaType } from "generated/graphql/types";
import { RedErrorMessage } from "common/components";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { getInitialCompany } from "form/bsdd/utils/initial-state";
import initialState from "../initial-state";

export function Worker({ disabled }) {
  const { setFieldValue, values, handleChange } = useFormikContext<Bsda>();
  const hasBroker = Boolean(values.broker);

  function onBrokerToggle() {
    if (hasBroker) {
      setFieldValue("broker", null);
    } else {
      setFieldValue(
        "broker",
        {
          company: getInitialCompany(),
          recepisse: {
            number: "",
            department: "",
            validityLimit: null,
          },
        },
        false
      );
    }
  }

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

          <h4 className="form__section-heading">Catégorie entreprise de travaux amiante</h4>

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

          <h4 className="form__section-heading">Courtier</h4>

          <div className="form__row">
            <label>
              <input
                type="checkbox"
                onChange={onBrokerToggle}
                disabled={disabled}
                checked={hasBroker}
                className="td-checkbox"
              />
              Je suis passé par un courtier
            </label>
          </div>

          {hasBroker && (
            <div className="form__row">
              <h4 className="form__section-heading">Courtier</h4>
              <CompanySelector
                name="broker.company"
                onCompanySelected={broker => {
                  if (broker.brokerReceipt) {
                    setFieldValue(
                      "broker.recepisse.number",
                      broker.brokerReceipt.receiptNumber
                    );
                    setFieldValue(
                      "broker.recepisse.validityLimit",
                      broker.brokerReceipt.validityLimit
                    );
                    setFieldValue(
                      "broker.recepisse.department",
                      broker.brokerReceipt.department
                    );
                  } else {
                    setFieldValue("broker.recepisse.number", "");
                    setFieldValue("broker.recepisse.validityLimit", null);
                    setFieldValue("broker.recepisse.department", "");
                  }
                }}
              />

              <div className="form__row">
                <label>
                  Numéro de récépissé
                  <Field
                    type="text"
                    name="broker.recepisse.number"
                    className="td-input td-input--medium"
                  />
                </label>

                <RedErrorMessage name="broker.recepisse.number" />
              </div>
              <div className="form__row">
                <label>
                  Département
                  <Field
                    type="text"
                    name="broker.recepisse.department"
                    placeholder="Ex: 83"
                    className="td-input td-input--small"
                  />
                </label>

                <RedErrorMessage name="broker.recepisse.department" />
              </div>
              <div className="form__row">
                <label>
                  Limite de validité
                  <Field
                    component={DateInput}
                    name="broker.recepisse.validityLimit"
                    className="td-input td-input--small"
                  />
                </label>

                <RedErrorMessage name="broker.recepisse.validityLimit" />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
