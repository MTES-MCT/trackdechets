import merge from "deepmerge";
import { Field, Form, Formik } from "formik";
import React, { useState } from "react";
import { removeNulls } from "src/common/helper";
import RedErrorMessage from "src/common/components/RedErrorMessage";
import CompanySelector from "src/form/company/CompanySelector";
import DateInput from "src/form/custom-inputs/DateInput";
import NumberInput from "src/form/custom-inputs/NumberInput";
import { RadioButton } from "src/form/custom-inputs/RadioButton";
import Packagings from "src/form/packagings/Packagings";
import { SlipActionProps } from "./SlipActions";
import { PROCESSING_OPERATIONS } from "src/generated/constants";
import { WasteDetails } from "src/generated/graphql/types";

export default function Resealed({
  form,
  onSubmit,
  onCancel,
}: SlipActionProps) {
  // We need a deep merge as sub-objects may be partially filled
  // But without the null values as they break form elements (uncontrolled)
  const initialValues = merge(
    emptyState,
    removeNulls(form.temporaryStorageDetail)
  );
  const [isRefurbished, setIsRefurbished] = useState(
    !!form.temporaryStorageDetail?.wasteDetails?.quantity
  );

  function onChangeRefurbished(values, setFieldValue: (field, value) => void) {
    const willBeRefurbished = !isRefurbished;
    setIsRefurbished(willBeRefurbished);

    if (willBeRefurbished) {
      const { wasteDetails } = form;

      if (wasteDetails == null) {
        return;
      }

      const keys: Array<keyof WasteDetails> = [
        "onuCode",
        "packagings",
        "otherPackaging",
        "numberOfPackages",
        "quantity",
        "quantityType",
      ];
      keys.forEach(key => {
        switch (key) {
          case "packagings": {
            if (
              wasteDetails[key].length > 0 &&
              values.wasteDetails[key].length === 0
            ) {
              setFieldValue(`wasteDetails.${key}`, wasteDetails[key]);
            }
            break;
          }
          default: {
            if (wasteDetails[key] && !values.wasteDetails[key]) {
              setFieldValue(`wasteDetails.${key}`, wasteDetails[key]);
            }
            break;
          }
        }
      });
    }
  }

  return (
    <div>
      <Formik
        initialValues={initialValues}
        onSubmit={values => onSubmit({ info: values })}
      >
        {({ values, setFieldValue }) => (
          <Form>
            <h5 className="form__section-heading">
              Installation de destination prévue
            </h5>

            <CompanySelector name="destination.company" />

            <div className="form__row">
              <label>
                Numéro de CAP (le cas échéant)
                <Field
                  type="text"
                  name="destination.cap"
                  className="td-input"
                />
              </label>
            </div>

            <div className="form__row">
              <label>
                Opération d'élimination / valorisation prévue (code D/R)
              </label>

              <Field
                component="select"
                name="destination.processingOperation"
                className="td-select"
              >
                <option value="">Choisissez...</option>
                {PROCESSING_OPERATIONS.map(operation => (
                  <option key={operation.code} value={operation.code}>
                    {operation.code} - {operation.description.substr(0, 50)}
                    {operation.description.length > 50 ? "..." : ""}
                  </option>
                ))}
              </Field>
            </div>

            <div className="form__row form__row--inline">
              <input
                type="checkbox"
                checked={isRefurbished}
                id="id_isRefurbished"
                className="td-checkbox"
                onChange={() => onChangeRefurbished(values, setFieldValue)}
              />
              <label htmlFor="id_isRefurbished">
                Les déchets ont subi un reconditionnement, je dois saisir les
                détails
              </label>
            </div>

            {isRefurbished && (
              <>
                <h5 className="form__section-heading">Détails du déchet</h5>

                <h4>Conditionnement</h4>
                <div className="form__row">
                  <Field
                    name="wasteDetails.packagings"
                    component={Packagings}
                  />

                  {values.wasteDetails.packagings.indexOf("AUTRE") > -1 && (
                    <label>
                      <Field
                        name="wasteDetails.otherPackaging"
                        type="text"
                        className="td-input"
                        placeholder="Détail de l'autre conditionnement"
                      />
                    </label>
                  )}

                  <Field
                    component={NumberInput}
                    name="wasteDetails.numberOfPackages"
                    className="td-input"
                    label="Nombre de colis"
                    min="1"
                  />
                  <RedErrorMessage name="wasteDetails.numberOfPackages" />
                </div>

                <h4>Quantité en tonnes</h4>
                <div className="form__row">
                  <Field
                    component={NumberInput}
                    name="wasteDetails.quantity"
                    className="td-input"
                    placeholder="En tonnes"
                    min="0"
                    step="0.001"
                  />

                  <RedErrorMessage name="wasteDetails.quantity" />

                  <fieldset>
                    <legend>Cette quantité est</legend>
                    <Field
                      name="wasteDetails.quantityType"
                      id="REAL"
                      label="Réelle"
                      component={RadioButton}
                    />
                    <Field
                      name="wasteDetails.quantityType"
                      id="ESTIMATED"
                      label="Estimée"
                      component={RadioButton}
                    />
                  </fieldset>

                  <RedErrorMessage name="wasteDetails.quantityType" />
                </div>
                <div className="form__row">
                  <label>
                    Mentions au titre des règlements ADR, RID, ADNR, IMDG (le
                    cas échéant)
                    <Field
                      type="text"
                      name="wasteDetails.onuCode"
                      className="td-input"
                    />
                  </label>
                </div>
              </>
            )}

            <h5 className="form__section-heading">
              Collecteur-transporteur après entreposage ou reconditionnement
            </h5>

            <CompanySelector name="transporter.company" />

            <div className="form__row form__row--inline">
              <Field
                type="checkbox"
                name="transporter.isExemptedOfReceipt"
                id="id_isExemptedOfReceipt"
                checked={values.transporter.isExemptedOfReceipt}
                className="td-checkbox"
              />
              <label htmlFor="id_isExemptedOfReceipt">
                Le transporteur déclare être exempté de récépissé conformément
                aux dispositions de l'article R.541-50 du code de
                l'environnement.
              </label>
            </div>
            {!values.transporter.isExemptedOfReceipt && (
              <div className="form__row">
                <label>
                  Numéro de récépissé
                  <Field
                    type="text"
                    name="transporter.receipt"
                    className="td-input"
                  />
                </label>

                <RedErrorMessage name="transporter.receipt" />

                <label>
                  Département
                  <Field
                    type="text"
                    name="transporter.department"
                    placeholder="Ex: 83"
                    className="td-input"
                  />
                </label>

                <RedErrorMessage name="transporter.department" />

                <label>
                  Limite de validité
                  <Field
                    component={DateInput}
                    name="transporter.validityLimit"
                    className="td-input"
                  />
                </label>

                <RedErrorMessage name="transporter.validityLimit" />

                <label>
                  Immatriculation
                  <Field
                    type="text"
                    name="transporter.numberPlate"
                    className="td-input"
                    placeholder="Plaque d'immatriculation du véhicule"
                  />
                </label>

                <RedErrorMessage name="transporter.numberPlate" />
              </div>
            )}

            <div className="form__actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={onCancel}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn--outline">
                Je valide
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

const emptyState = {
  destination: {
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: "",
    },
    cap: "",
    processingOperation: "",
  },
  transporter: {
    isExemptedOfReceipt: false,
    receipt: "",
    department: "",
    validityLimit: null,
    numberPlate: "",
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: "",
    },
  },
  wasteDetails: {
    onuCode: "",
    packagings: [] as string[],
    otherPackaging: "",
    numberOfPackages: null,
    quantity: null,
    quantityType: "ESTIMATED",
  },
};
