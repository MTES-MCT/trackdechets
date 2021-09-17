import React from "react";
import { RedErrorMessage } from "common/components";
import { BsdasriSignatureType } from "generated/graphql/types";
import Packagings from "form/bsdasri/components/packagings/Packagings";
import QuantityWidget from "form/bsdasri/components/Quantity";
import DateInput from "form/common/components/custom-inputs/DateInput";
import Acceptation from "form/bsdasri/components/acceptation/Acceptation";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import {
  ExtraSignatureType,
  SignatureType,
} from "dashboard/components/BSDList/BSDasri/types";
import { Field } from "formik";
import omit from "object.omit";
import { getInitialQuantityFn } from "./utils";

export function ProducerSignatureForm() {
  return (
    <>
      <div className="form__row">
        <Field
          name="emission.wasteDetails.packagingInfos"
          component={Packagings}
        />
      </div>
      <h4 className="form__section-heading">Quantité remise</h4>
      <div className="form__row">
        <QuantityWidget
          switchLabel="Je souhaite ajouter une quantité"
          dasriSection="emission"
          getInitialQuantityFn={getInitialQuantityFn}
        />
      </div>
      <div className="form__row">
        <label>
          Code ADR
          <Field
            type="text"
            name="emission.wasteDetails.onuCode"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="emission.wasteDetails.onuCode" />
      </div>
      <div className="form__row">
        <label>
          Date de remise au collecteur transporteur
          <div className="td-date-wrapper">
            <Field
              name="emission.handedOverAt"
              component={DateInput}
              className="td-input"
            />
          </div>{" "}
        </label>
      </div>
    </>
  );
}
export function TransportSignatureForm() {
  return (
    <>
      <div className="form__row">
        <label>
          Numéro de récépissé
          <Field type="text" name="transporter.receipt" className="td-input" />
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
            />
          </div>
        </label>

        <RedErrorMessage name="transporter.receiptValidityLimit" />
      </div>

      <div className="form__row">
        <Field name="transport.wasteAcceptation" component={Acceptation} />
      </div>
      <div className="form__row">
        <label>
          Date de prise en charge
          <div className="td-date-wrapper">
            <Field
              name="transport.takenOverAt"
              component={DateInput}
              className="td-input"
            />
          </div>
        </label>
      </div>
      <div className="form__row">
        <Field
          name="transport.wasteDetails.packagingInfos"
          component={Packagings}
        />
      </div>
      <h4 className="form__section-heading">Quantité transportée</h4>

      <QuantityWidget
        switchLabel="Je souhaite ajouter une quantité"
        dasriSection="transport"
        getInitialQuantityFn={getInitialQuantityFn}
      />
    </>
  );
}

export function ReceptionSignatureForm() {
  return (
    <>
      <div className="form__row">
        <Field name="reception.wasteAcceptation" component={Acceptation} />
      </div>
      <div className="form__row">
        <label>
          Date de réception
          <div className="td-date-wrapper">
            <Field
              name="reception.receivedAt"
              component={DateInput}
              className="td-input"
            />
          </div>
        </label>
        <RedErrorMessage name="reception.receivedAt" />
      </div>
      <div className="form__row">
        <Field
          name="reception.wasteDetails.packagingInfos"
          component={Packagings}
        />
      </div>
    </>
  );
}
export function OperationSignatureForm() {
  return (
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
            D12 - Groupement avant désinfection en D9 ou incinération en D10 sur
            un site relevant de la rubrique 2718
          </option>
          <option value="R12">
            R12 - Groupement avant incinération en R1, sur un site relevant de
            la rubrique 2718
          </option>
        </Field>
      </div>
      <div className="form__row">
        <label>
          Date de traitement :
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
  );
}

export const removeSections = (input, signatureType: SignatureType) => {
  const emitterKey = "emitter";
  const emissionKey = "emission";
  const transportKey = "transport";
  const transporterKey = "transporter";
  const recipientKey = "recipient";
  const receptionKey = "reception";
  const operationKey = "operation";
  const regroupedBsdasrisKey = "regroupedBsdasris";

  const mapping = {
    [BsdasriSignatureType.Emission]: [
      transporterKey,
      transportKey,
      recipientKey,
      receptionKey,
      operationKey,
      regroupedBsdasrisKey,
    ],
    [BsdasriSignatureType.Transport]: [
      emitterKey,
      emissionKey,
      recipientKey,
      receptionKey,
      operationKey,
      regroupedBsdasrisKey,
    ],
    [ExtraSignatureType.DirectTakeover]: [
      emitterKey,
      emissionKey,
      recipientKey,
      receptionKey,
      operationKey,
      regroupedBsdasrisKey,
    ],
    [BsdasriSignatureType.Reception]: [
      emitterKey,
      emissionKey,
      transporterKey,
      transportKey,
      operationKey,
      regroupedBsdasrisKey,
    ],
    [BsdasriSignatureType.Operation]: [
      emitterKey,
      emissionKey,
      transporterKey,
      transportKey,
      recipientKey,
      receptionKey,
      regroupedBsdasrisKey,
    ],
  };
  return omit(input, mapping[signatureType]);
};
