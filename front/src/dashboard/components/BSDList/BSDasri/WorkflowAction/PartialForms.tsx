import React, { useEffect } from "react";
import { RedErrorMessage } from "../../../../../common/components";
import { BsdasriSignatureType, BsdasriStatus } from "codegen-ui";
import Packagings from "../../../../../form/bsdasri/components/packagings/Packagings";
import WeightWidget from "../../../../../form/bsdasri/components/Weight";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import Acceptation from "../../../../../form/bsdasri/components/acceptation/Acceptation";
import NumberInput from "../../../../../form/common/components/custom-inputs/NumberInput";
import { ExtraSignatureType, SignatureType } from "../types";
import { Field, useFormikContext } from "formik";
import omitDeep from "omit-deep-lodash";
import { getInitialWeightFn } from "../../../../../form/bsdasri/utils/initial-state";
import { Bsdasri, BsdasriType } from "codegen-ui";
import Transport from "../../../../../form/bsdasri/steps/Transport";
import TransporterReceipt from "../../../../../form/common/components/company/TransporterReceipt";
import { subMonths } from "date-fns";
import OperationModeSelect from "../../../../../common/components/OperationModeSelect";

export function EmitterSignatureForm() {
  return (
    <>
      <div className="form__row">
        <label>
          Personne à contacter
          <Field
            type="text"
            name="emitter.company.contact"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="emitter.company.contact" />
      </div>
      <div className="form__row">
        <label>
          Téléphone ou Fax
          <Field
            type="text"
            name="emitter.company.phone"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="emitter.company.phone" />
      </div>
      <div className="form__row">
        <Field name="emitter.emission.packagings" component={Packagings} />
      </div>
      <h4 className="form__section-heading">Quantité remise</h4>
      <div className="form__row">
        <WeightWidget
          switchLabel="Je préciser une quantité"
          dasriPath="emitter.emission"
          getInitialWeightFn={getInitialWeightFn}
        />
      </div>
      <div className="form__row">
        <label>
          Code ADR
          <Field type="text" name="waste.adr" className="td-input" />
        </label>

        <RedErrorMessage name="waste.adr" />
      </div>
    </>
  );
}
export function TransportSignatureForm() {
  const { values } = useFormikContext<Bsdasri>();

  return (
    <>
      <div className="form__row">
        <label>
          Personne à contacter
          <Field
            type="text"
            name="transporter.company.contact"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="transporter.company.contact" />
      </div>
      <div className="form__row">
        <label>
          Téléphone ou Fax
          <Field
            type="text"
            name="transporter.company.phone"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="transporter.company.phone" />
      </div>

      <Transport status={BsdasriStatus.SignedByProducer} />
      <TransporterReceipt transporter={values.transporter!} />
    </>
  );
}

export function SynthesisTransportSignatureForm() {
  const { setFieldValue, values } = useFormikContext<Bsdasri>();

  // is always accepted for synthesis
  useEffect(() => {
    setFieldValue(`transporter.transport.acceptation.status`, "ACCEPTED");
  }, [setFieldValue]);

  return (
    <>
      <TransporterReceipt transporter={values.transporter!} />
      <div className="form__row">
        <label>
          Date de prise en charge
          <div className="td-date-wrapper">
            <Field
              name="transporter.transport.takenOverAt"
              component={DateInput}
              className="td-input"
            />
          </div>
        </label>
      </div>
      <div className="form__row">
        <Field
          name="transporter.transport.packagingInfos"
          component={Packagings}
        />
      </div>
      <h4 className="form__section-heading">Quantité transportée</h4>

      <WeightWidget
        switchLabel="Je souhaite préciser le poids"
        dasriPath="transporter.transport"
        getInitialWeightFn={getInitialWeightFn}
      />
    </>
  );
}

export function ReceptionSignatureForm() {
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  // is always accepted for synthesis
  useEffect(() => {
    if (values.type === BsdasriType.Synthesis) {
      setFieldValue(`destination.reception.acceptation.status`, "ACCEPTED");
    }
  }, [setFieldValue, values.type]);

  const TODAY = new Date();

  return (
    <>
      <div className="form__row">
        <label>
          Personne à contacter
          <Field
            type="text"
            name="destination.company.contact"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="destination.company.contact" />
      </div>
      <div className="form__row">
        <label>
          Téléphone ou Fax
          <Field
            type="text"
            name="destination.company.phone"
            className="td-input"
          />
        </label>
        <RedErrorMessage name="destination.company.phone" />
      </div>
      <div className="form__row">
        <Field name="destination.reception.packagings" component={Packagings} />
      </div>
      {values.type !== BsdasriType.Synthesis && (
        <div className="form__row">
          <Field
            name="destination.reception.acceptation"
            component={Acceptation}
          />
        </div>
      )}
      <div className="form__row">
        <label>
          Date de réception
          <div className="td-date-wrapper">
            <Field
              name="destination.reception.date"
              component={DateInput}
              minDate={subMonths(TODAY, 2)}
              maxDate={TODAY}
              className="td-input"
            />
          </div>
        </label>
        <RedErrorMessage name="destination.reception.date" />
      </div>
      <div className="form__row">
        <Field
          name="destination.reception.packagingInfos"
          component={Packagings}
        />
      </div>
    </>
  );
}
export function OperationSignatureForm() {
  const TODAY = new Date();
  const { values } = useFormikContext<Bsdasri>();
  return (
    <>
      <div className="form__row">
        <label>Opération réalisée</label>
        <Field
          as="select"
          name="destination.operation.code"
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
          {values.type !== BsdasriType.Synthesis ? (
            <>
              <option value="D12">
                D12 - Groupement avant désinfection en D9 ou incinération en D10
                sur un site relevant de la rubrique 2718
              </option>
              <option value="R12">
                R12 - Groupement avant incinération en R1, sur un site relevant
                de la rubrique 2718
              </option>
            </>
          ) : null}
        </Field>
      </div>
      <OperationModeSelect
        operationCode={values?.destination?.operation?.code}
        name="destination.operation.mode"
      />
      <div className="form__row">
        <label>
          Date de traitement :
          <div className="td-date-wrapper">
            <Field
              name="destination.operation.date"
              component={DateInput}
              minDate={subMonths(TODAY, 2)}
              maxDate={TODAY}
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
            name="destination.operation.weight.value"
            className="td-input dasri__waste-details__weight"
            placeholder="En kg"
            min="0"
            step="0.1"
          />
        </label>

        <RedErrorMessage name="destination.operation.weight.value" />
      </div>
    </>
  );
}

export const removeSections = (input, signatureType: SignatureType) => {
  const emitterKey = "emitter";
  const wasteKey = "waste";
  const ecoOrganismeKey = "ecoOrganisme";
  const transporterKey = "transporter";
  const destinationKey = "destination";
  const receptionKey = "reception";
  const operationKey = "operation";
  const wholeCompanyKey = "company";
  const companySiretKey = "siret";
  const companyNameKey = "name";
  const customInfoKey = "customInfo";
  const groupingKey = "grouping";
  const synthesizingKey = "synthesizing";
  const synthesizedInKey = "synthesizedIn";
  const identificationKey = "identification";
  const vatNumberKey = "vatNumber";
  const transporterTransportPackagingsKey = "transporter.transport.packagings";
  const transporterTransportVolumeKey = "transporter.transport.volume";

  const common = [
    wasteKey,
    companySiretKey,
    companyNameKey,
    ecoOrganismeKey,
    customInfoKey,
    groupingKey,
    synthesizingKey,
    synthesizedInKey,
    transporterTransportVolumeKey
  ];
  const mapping = {
    [BsdasriSignatureType.Emission]: [
      transporterKey,
      destinationKey,
      ...common
    ],

    [ExtraSignatureType.SynthesisTakeOver]: [
      emitterKey,
      destinationKey,
      vatNumberKey,
      transporterTransportPackagingsKey,

      ...common
    ],
    [BsdasriSignatureType.Transport]: [emitterKey, destinationKey, ...common],
    [ExtraSignatureType.DirectTakeover]: [
      emitterKey,
      destinationKey,
      ...common
    ],
    [BsdasriSignatureType.Reception]: [
      emitterKey,
      transporterKey,
      operationKey,
      ...common
    ],
    [BsdasriSignatureType.Operation]: [
      emitterKey,
      transporterKey,
      receptionKey,
      wholeCompanyKey,
      identificationKey,
      ...common
    ]
  };
  const { type, ...payload } = input;
  return omitDeep(payload, mapping[signatureType]);
};
