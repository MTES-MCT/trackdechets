import React from "react";
import { Field } from "formik";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import { Input } from "@codegouvfr/react-dsfr/Input";

/**
 * Vhu agrement Formik fields for company creation
 */
export default function AccountCompanyAddVhuAgrement() {
  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <p className="fr-text--bold">
            Agrément démolisseur - casse automobile (optionnel)
          </p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-6">
          <Field name="vhuAgrementDemolisseurNumber">
            {({ field }) => {
              return (
                <Input
                  label="Numéro d'agrément"
                  nativeInputProps={{
                    name: field.name,
                    checked: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur
                  }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="vhuAgrementDemolisseurNumber" />
        </div>
        <div className="fr-col-3">
          <Field name="vhuAgrementDemolisseurDepartment">
            {({ field }) => {
              return (
                <Input
                  label="Département"
                  nativeInputProps={{
                    placeholder: "75",
                    name: field.name,
                    checked: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur
                  }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="vhuAgrementDemolisseurDepartment" />
        </div>
      </div>
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <p className="fr-text--bold">Agrément broyeur (optionnel)</p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-6">
          <Field name="vhuAgrementBroyeurNumber">
            {({ field }) => {
              return (
                <Input
                  label="Numéro d'agrément"
                  nativeInputProps={{
                    name: field.name,
                    checked: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur
                  }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="vhuAgrementBroyeurNumber" />
        </div>
        <div className="fr-col-3">
          <Field name="vhuAgrementBroyeurDepartment">
            {({ field }) => {
              return (
                <Input
                  label="Département"
                  nativeInputProps={{
                    placeholder: "75",
                    name: field.name,
                    checked: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur
                  }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="vhuAgrementBroyeurDepartment" />
        </div>
      </div>
    </div>
  );
}
