import RedErrorMessage from "common/components/RedErrorMessage";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Field, useFormikContext } from "formik";
import { BsdasriStatus } from "generated/graphql/types";
import React from "react";
import Acceptation from "form/bsdasri/components/acceptation/Acceptation";
import Packagings from "./components/packagings/Packagings";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import NumberInput from "form/common/components/custom-inputs/NumberInput";

export default function Transporter({ status }) {
  const { setFieldValue } = useFormikContext();

  // it's pointless to show transport fields until form is signed by producer
  const showTransportFields = [
    BsdasriStatus.SignedByProducer,
    BsdasriStatus.Sent,
  ].includes(status);

  const disabled = [BsdasriStatus.Sent, BsdasriStatus.Received].includes(
    status
  );

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <CompanySelector
        disabled={disabled}
        name="transporter.company"
        heading="Entreprise de transport"
        onCompanySelected={transporter => {
          if (transporter.transporterReceipt) {
            setFieldValue(
              "transporter.receipt",
              transporter.transporterReceipt.receiptNumber
            );
            setFieldValue(
              "transporter.receiptValidityLimit",
              transporter.transporterReceipt.validityLimit
            );
            setFieldValue(
              "transporter.receiptDepartment",
              transporter.transporterReceipt.department
            );
          } else {
            setFieldValue("transporter.receipt", "");
            setFieldValue("transporter.receiptValidityLimit", null);
            setFieldValue("transporter.receiptDepartment", "");
          }
        }}
      />
      <div className="form__row">
        <label>
          Champ libre
          <Field
            component="textarea"
            name="transporter.customInfo"
            className="td-textarea"
            disabled={disabled}
          />
        </label>
      </div>

      <h4 className="form__section-heading">Autorisations</h4>
      <div className="form__row">
        <label>
          Numéro de récépissé
          <Field
            type="text"
            name="transporter.receipt"
            className="td-input"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="transporter.receipt" />
      </div>
      <div className="form__row">
        <label>
          Département
          <Field
            type="text"
            name="transporter.receiptDepartment"
            placeholder="Ex: 83"
            className="td-input td-department"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="transporter.receiptDepartment" />
      </div>
      <div className="form__row">
        <label>
          Limite de validité
          <div className="td-date-wrapper">
            <Field
              component={DateInput}
              name="transporter.receiptValidityLimit"
              className="td-input td-date"
              disabled={disabled}
            />
          </div>
        </label>

        <RedErrorMessage name="transporter.receiptValidityLimit" />
      </div>

      <h4 className="form__section-heading">Transport du déchet</h4>
      <Field
        name="transport.wasteAcceptation"
        component={Acceptation}
        disabled={disabled}
      />
      {showTransportFields ? (
        <>
          <div className="form__row">
            <label>
              Date de prise en charge
              <div className="td-date-wrapper">
                <Field
                  name="transport.takenOverAt"
                  component={DateInput}
                  className="td-input"
                  disabled={disabled}
                />
              </div>
            </label>
          </div>
          <Field
            name="transport.wasteDetails.packagingInfos"
            component={Packagings}
            disabled={disabled}
          />
          <h4 className="form__section-heading">Quantité en kg</h4>

          <div className="form__row">
            <label>
              Quantité transportée :
              <Field
                component={NumberInput}
                name="transport.wasteDetails.quantity"
                className="td-input dasri__waste-details__quantity"
                disabled={disabled}
                placeholder="En kg"
                min="0"
                step="1"
              />
              <span className="tw-ml-2">kg</span>
            </label>

            <RedErrorMessage name="transport.wasteDetails.quantity" />
          </div>

          <div className="form__row">
            <fieldset>
              <legend className="tw-font-semibold">Cette quantité est</legend>
              <Field
                name="transport.wasteDetails.quantityType"
                id="REAL"
                label="Réélle"
                component={RadioButton}
                disabled={disabled}
              />
              <Field
                name="transport.wasteDetails.quantityType"
                id="ESTIMATED"
                label="Estimée"
                component={RadioButton}
                disabled={disabled}
              />
            </fieldset>
          </div>
        </>
      ) : (
        <p>Cette section sera disponible quand le déchet aura été envoyé</p>
      )}

      <div className="form__row">
        <label>
          Date de remise à l'installation destinataire
          <div className="td-date-wrapper">
            <Field
              name="transport.handedOverAt"
              component={DateInput}
              className="td-input"
            />
          </div>
        </label>
      </div>
    </>
  );
}
