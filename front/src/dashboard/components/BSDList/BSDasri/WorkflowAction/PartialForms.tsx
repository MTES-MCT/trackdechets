import React from "react";
import { RedErrorMessage } from "common/components";
import { BsdasriSignatureType, BsdasriStatus } from "generated/graphql/types";
import Packagings from "form/bsdasri/components/packagings/Packagings";
import WeightWidget from "form/bsdasri/components/Weight";
import DateInput from "form/common/components/custom-inputs/DateInput";
import Acceptation, {
  AcceptOnlyField,
} from "form/bsdasri/components/acceptation/Acceptation";
import NumberInput from "form/common/components/custom-inputs/NumberInput";

import {
  ExtraSignatureType,
  SignatureType,
} from "dashboard/components/BSDList/BSDasri/types";
import { Field, useFormikContext } from "formik";
import { omitDeep } from "common/omitDeep";
import { getInitialWeightFn } from "form/bsdasri/utils/initial-state";
import { Bsdasri, BsdasriType } from "generated/graphql/types";
import Transport from "form/bsdasri/steps/Transport";

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
          switchLabel="Je souhaite ajouter un poids"
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
    </>
  );
}
// export function TransportSignatureForm_() {
//   const { values, setFieldValue } = useFormikContext<Bsdasri>();
//   const AcceptationComponent =
//     values.type === BsdasriType.Synthesis ? AcceptOnlyField : Acceptation;

//   function handleTransportMode(e) {
//     setFieldValue("transporter.transport.mode", e.target.value, false);
//     if (e.target.value !== "ROAD") {
//       setFieldValue("transporter.transport.plates", [], false);
//     }
//   }
//   return (
//     <>
//       <div className="form__row">
//         <label>
//           Numéro de récépissé
//           <Field
//             type="text"
//             name="transporter.recepisse.number"
//             className="td-input"
//           />
//         </label>

//         <RedErrorMessage name="transporter.recepisse.number" />
//       </div>
//       <div className="form__row">
//         <label>
//           Département
//           <Field
//             type="text"
//             name="transporter.recepisse.department"
//             placeholder="Ex: 83"
//             className="td-input td-department"
//           />
//         </label>

//         <RedErrorMessage name="transporter.recepisse.department" />
//       </div>
//       <div className="form__row">
//         <label>
//           Limite de validité
//           <div className="td-date-wrapper">
//             <Field
//               component={DateInput}
//               name="transporter.recepisse.validityLimit"
//               className="td-input td-date"
//             />
//           </div>
//         </label>

//         <RedErrorMessage name="transporter.recepisse.validityLimit" />
//       </div>
//       <h4 className="form__section-heading">Transport du déchet</h4>

//       <div className="form__row">
//         <label>Mode de transport</label>
//         <Field
//           id="id_mode"
//           name="transporter.transport.mode"
//           component={FieldTransportModeSelect}
//           onChange={e => handleTransportMode(e)}
//         ></Field>
//       </div>
//       <div className="form__row">
//         <Field
//           name="transporter.transport.acceptation"
//           component={AcceptationComponent}
//         />
//       </div>
//       <div className="form__row">
//         <label>
//           Date de prise en charge
//           <div className="td-date-wrapper">
//             <Field
//               name="transporter.transport.takenOverAt"
//               component={DateInput}
//               className="td-input"
//             />
//           </div>
//         </label>
//       </div>
//       <div className="form__row">
//         <Field name="transporter.transport.packagings" component={Packagings} />
//       </div>
//       <h4 className="form__section-heading">Quantité transportée</h4>

//       <WeightWidget
//         switchLabel="Je souhaite ajouter un poids"
//         dasriPath="transporter.transport"
//         getInitialWeightFn={getInitialWeightFn}
//       />
//     </>
//   );
// }
export function SynthesisTransportSignatureForm() {
  return (
    <>
      <div className="form__row">
        <label>
          Numéro de récépissé
          <Field
            type="text"
            name="transporter.recepisse.number"
            className="td-input"
          />
        </label>

        <RedErrorMessage name="transporter.recepisse.number" />
      </div>
      <div className="form__row">
        <label>
          Département
          <Field
            type="text"
            name="transporter.recepisse.department"
            placeholder="Ex: 83"
            className="td-input td-department"
          />
        </label>

        <RedErrorMessage name="transporter.recepisse.department" />
      </div>
      <div className="form__row">
        <label>
          Limite de validité
          <div className="td-date-wrapper">
            <Field
              component={DateInput}
              name="transporter.recepisse.validityLimit"
              className="td-input td-date"
            />
          </div>
        </label>

        <RedErrorMessage name="transporter.recepisse.validityLimit" />
      </div>

      <div className="form__row">
        <Field
          name="transporter.transport.acceptation"
          component={Acceptation}
        />
      </div>
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
        switchLabel="Je souhaite ajouter un poids"
        dasriPath="transporter.transport"
        getInitialWeightFn={getInitialWeightFn}
      />
    </>
  );
}

export function ReceptionSignatureForm() {
  const { values } = useFormikContext<Bsdasri>();
  const AcceptationComponent =
    values.type === BsdasriType.Synthesis ? AcceptOnlyField : Acceptation;
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
        <Field
          name="destination.reception.acceptation"
          component={AcceptationComponent}
        />
      </div>
      <div className="form__row">
        <label>
          Date de réception
          <div className="td-date-wrapper">
            <Field
              name="destination.reception.date"
              component={DateInput}
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
              name="destination.operation.date"
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
            name="destination.operation.weight.value"
            className="td-input dasri__waste-details__weight"
            placeholder="En kg"
            min="0"
            step="0.1"
          />
          <span className="tw-ml-2">kg</span>
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
  const groupingBsdasrisKey = "grouping";
  const synthesizingBsdasrisKey = "synthesizing";
  const synthesizedInKey = "synthesizedIn";
  const identificationKey = "identification";

  const common = [
    wasteKey,
    companySiretKey,
    companyNameKey,
    ecoOrganismeKey,
    customInfoKey,
    groupingBsdasrisKey,
    synthesizingBsdasrisKey,
    synthesizedInKey,
  ];
  const mapping = {
    [BsdasriSignatureType.Emission]: [
      transporterKey,
      destinationKey,
      ...common,
    ],
    [ExtraSignatureType.SynthesisEmission]: [
      transporterKey,
      destinationKey,
      ...common,
    ],
    [BsdasriSignatureType.Transport]: [emitterKey, destinationKey, ...common],
    [ExtraSignatureType.DirectTakeover]: [
      emitterKey,
      destinationKey,
      ...common,
    ],
    [BsdasriSignatureType.Reception]: [
      emitterKey,
      transporterKey,
      operationKey,
      ...common,
    ],
    [BsdasriSignatureType.Operation]: [
      emitterKey,
      transporterKey,
      receptionKey,
      wholeCompanyKey,
      identificationKey,
      ...common,
    ],
  };
  const { type, ...payload } = input;
  return omitDeep(payload, mapping[signatureType]);
};
