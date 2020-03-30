import merge from "deepmerge";
import { Field, Form, Formik } from "formik";
import React from "react";
import RedErrorMessage from "../../../common/RedErrorMessage";
import CompanySelector from "../../../form/company/CompanySelector";
import DateInput from "../../../form/custom-inputs/DateInput";
import NumberInput from "../../../form/custom-inputs/NumberInput";
import { RadioButton } from "../../../form/custom-inputs/RadioButton";
import Packagings from "../../../form/packagings/Packagings";
import { SlipActionProps } from "../SlipActions";

export default function Resent({ form, onSubmit, onCancel }: SlipActionProps) {
  // We need a deep merge as sub-objects may be partially filled
  const initialValues = merge(emptyState, form.temporaryStorageDetail);

  return (
    <div>
      <Formik
        initialValues={initialValues}
        onSubmit={values => onSubmit({ info: values })}
      >
        {({ values }) => (
          <Form>
            <h5>Installation de destination prévue</h5>

            <CompanySelector name="destination.company" />

            <h5>Détails du déchet</h5>
            <div className="notification info">
              Les champs concernant le détail du déchet sont à remplir en cas de
              reconditionnement uniquement.
            </div>

            <h4>Conditionnement</h4>
            <div className="form__group">
              <Field name="wasteDetails.packagings" component={Packagings} />

              {values.wasteDetails.packagings.indexOf("AUTRE") > -1 && (
                <label>
                  <Field
                    name="wasteDetails.otherPackaging"
                    type="text"
                    placeholder="Détail de l'autre conditionnement"
                  />
                </label>
              )}

              <Field
                component={NumberInput}
                name="wasteDetails.numberOfPackages"
                label="Nombre de colis"
              />
              <RedErrorMessage name="wasteDetails.numberOfPackages" />
            </div>

            <div className="form__group">
              <fieldset>
                <legend>Consistance</legend>
                <Field
                  name="wasteDetails.consistence"
                  id="SOLID"
                  label="Solide"
                  component={RadioButton}
                />
                <Field
                  name="wasteDetails.consistence"
                  id="LIQUID"
                  label="Liquide"
                  component={RadioButton}
                />
                <Field
                  name="wasteDetails.consistence"
                  id="GASEOUS"
                  label="Gazeux"
                  component={RadioButton}
                />
              </fieldset>

              <RedErrorMessage name="wasteDetails.consistence" />
            </div>

            <h4>Quantité en tonnes</h4>
            <div className="form__group">
              <Field
                component={NumberInput}
                name="wasteDetails.quantity"
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
            <div className="form__group">
              <label>
                Mentions au titre des règlements ADR, RID, ADNR, IMDG (le cas
                échéant)
                <Field type="text" name="wasteDetails.onuCode" />
              </label>
            </div>

            <h5>
              Collecteur-transporteur après entreposage ou reconditionnement
            </h5>

            <CompanySelector name="transporter.company" />

            <div className="form__group">
              <label>
                <Field
                  type="checkbox"
                  name="transporter.isExemptedOfReceipt"
                  checked={values.transporter.isExemptedOfReceipt}
                />
                Le transporteur déclare être exempté de récépissé conformément
                aux dispositions de l'article R.541-50 du code de
                l'environnement.
              </label>
            </div>
            {!values.transporter.isExemptedOfReceipt && (
              <div className="form__group">
                <label>
                  Numéro de récépissé
                  <Field type="text" name="transporter.receipt" />
                </label>

                <RedErrorMessage name="transporter.receipt" />

                <label>
                  Département
                  <Field
                    type="text"
                    name="transporter.department"
                    placeholder="Ex: 83"
                  />
                </label>

                <RedErrorMessage name="transporter.department" />

                <label>
                  Limite de validité
                  <Field
                    component={DateInput}
                    name="transporter.validityLimit"
                  />
                </label>

                <RedErrorMessage name="transporter.validityLimit" />

                <label>
                  Immatriculation
                  <Field
                    type="text"
                    name="transporter.numberPlate"
                    placeholder="Plaque d'immatriculation du véhicule"
                  />
                </label>

                <RedErrorMessage name="transporter.numberPlate" />
              </div>
            )}

            <h5>
              Déclaration de l’exploitant du site d’entreposage ou de
              reconditionnement
            </h5>
            <label>
              Nom du responsable
              <Field type="text" name="signedBy" placeholder="NOM Prénom" />
            </label>
            <label>
              Date d'envoi
              <Field component={DateInput} name="signedAt" />
            </label>
            <p>
              En validant, je certifie que les renseignements portés ci-dessus
              sont exacts et établis de bonne foi
            </p>
            <div className="form__group button__group">
              <button
                type="button"
                className="button secondary"
                onClick={onCancel}
              >
                Annuler
              </button>
              <button type="submit" className="button">
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
      phone: ""
    }
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
      phone: ""
    }
  },
  trader: {
    receipt: "",
    department: "",
    validityLimit: null,
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: ""
    }
  },
  wasteDetails: {
    code: "",
    name: "",
    onuCode: "",
    packagings: [],
    otherPackaging: "",
    numberOfPackages: null,
    quantity: null,
    quantityType: "ESTIMATED",
    consistence: "SOLID"
  },
  signedBy: "",
  signedAt: ""
};
