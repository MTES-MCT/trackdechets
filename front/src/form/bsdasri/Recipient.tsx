import { RedErrorMessage } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import Acceptation from "form/bsdasri/components/acceptation/Acceptation";
import { Field } from "formik";
import React from "react";
import { BsdasriStatus } from "generated/graphql/types";
import Packagings from "./components/packagings/Packagings";
import DateInput from "form/common/components/custom-inputs/DateInput";
import NumberInput from "form/common/components/custom-inputs/NumberInput";

export default function Recipient({ status }) {
  const receptionDisabled = BsdasriStatus.Received === status;
  // it's pointless to show reception or operation fields until form has relevant signatures
  const showReceptionFields = [
    BsdasriStatus.Sent,
    BsdasriStatus.Received,
  ].includes(status);
  const showOperationFields = status === BsdasriStatus.Received;

  return (
    <>
      {receptionDisabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <CompanySelector
        name="recipient.company"
        heading="Installation destinataire"
        disabled={receptionDisabled}
        optionalMail={true}
      />

      <div className="form__row">
        <label>
          Champ libre (optionnel)
          <Field
            component="textarea"
            name="recipient.customInfo"
            className="td-textarea"
            disabled={receptionDisabled}
          />
        </label>
      </div>
      <h4 className="form__section-heading">Réception du déchet</h4>
      {showReceptionFields ? (
        <>
          <Field name="reception.wasteAcceptation" component={Acceptation} />
          <div className="form__row">
            <label>
              Date de réception
              <div className="td-date-wrapper">
                <Field
                  name="reception.receivedAt"
                  component={DateInput}
                  className="td-input"
                  disabled={receptionDisabled}
                />
              </div>
            </label>
            <RedErrorMessage name="reception.receivedAt" />
          </div>

          <Field
            name="reception.wasteDetails.packagingInfos"
            component={Packagings}
            disabled={receptionDisabled}
          />
        </>
      ) : (
        <p>Cette section sera disponible quand le déchet aura été envoyé</p>
      )}
      <h4 className="form__section-heading">Traitement du déchet</h4>
      {/*No need to disable operation fields, processed form are not editable */}
      {showOperationFields ? (
        <>
          <div className="form__row">
            <label>Opération réalisée</label>
            <Field
              as="select"
              name="operation.processingOperation"
              className="td-select"
            >
              <option value="">-----</option>

              <option value="D9">
                D9 - Prétraitement par désinfection - Banaliseur
              </option>
              <option value="D10">D10 - Incinération</option>
              <option value="R1">
                R1 - Incinération + valorisation énergétique
              </option>
              <option value="D12">
                D12 - Groupement avant désinfection en D9 ou incinération en D10
                sur un site relevant de la rubrique 2718
              </option>
              <option value="R12">
                R12 - Groupement avant incinération en R1, sur un site relevant
                de la rubrique 2718
              </option>
            </Field>
          </div>
          <div className="form__row">
            <label>
              Date de l'opération :
              <div className="td-date-wrapper">
                <Field
                  name="operation.processedAt"
                  component={DateInput}
                  className="td-input"
                />
              </div>
            </label>
          </div>

          <h4 className="form__section-heading">Quantité traitée</h4>

          <div className="form__row">
            <label>
              Quantité en kg :
              <Field
                component={NumberInput}
                name="operation.quantity.value"
                className="td-input dasri__waste-details__quantity"
                placeholder="En kg"
                min="0"
                step="0.1"
              />
              <span className="tw-ml-2">kg</span>
            </label>

            <RedErrorMessage name="operation.quantity.value" />
          </div>
        </>
      ) : (
        <p>Cette section sera disponible quand le déchet aura été reçu</p>
      )}
    </>
  );
}
