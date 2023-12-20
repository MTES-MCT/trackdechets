import React from "react";
import { Field, useField } from "formik";
import Input from "@codegouvfr/react-dsfr/Input";

interface CompanyContactInfoProps {
  fieldName: string;
  allowForeignCompanies?: boolean;
  disabled?: boolean;
  optionalMail?: boolean;
  shouldUpdateFields?: boolean;
}

/**
 * Formulaire pour mettre à jour les informations de contact d'un établissement.
 * Utilisé en conjonction avec `CompanySelectorWrapper`, les données
 * peuvent être auto-complétées dès qu'un établissement est sélectionné
 * dans le CompanySelector. Ex :
 *
 * const [_, _, { setValue }] = useField(fieldName)
 * <>
 *  <CompanySelectorWrapper
 *     onCompanySelected={(company) => setValue(...)} // auto-complète les infos
 *  />
 *  <CompanyContactInfo fieldName={fieldName}>
 * <>
 *
 */
export default function CompanyContactInfo({
  fieldName
}: CompanyContactInfoProps) {
  const [, { error: contactError, touched: contactTouched }] = useField({
    name: `${fieldName}.contact`
  });

  const [, { error: phoneError, touched: phoneTouched }] = useField({
    name: `${fieldName}.phone`
  });

  const [, { error: mailError, touched: mailTouched }] = useField({
    name: `${fieldName}.mail`
  });

  return (
    <div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
        <div className="fr-col-12 fr-col-md-6">
          <Field name={`${fieldName}.contact`}>
            {({ field }) => (
              <Input
                label="Personne à contacter"
                state={contactError && contactTouched ? "error" : "default"}
                stateRelatedMessage={contactError}
                nativeInputProps={field}
              />
            )}
          </Field>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--top">
        <div className="fr-col-12 fr-col-md-6">
          <Field name={`${fieldName}.phone`}>
            {({ field }) => (
              <Input
                label="Téléphone"
                state={phoneError && phoneTouched ? "error" : "default"}
                stateRelatedMessage={phoneError}
                nativeInputProps={field}
              />
            )}
          </Field>
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Field name={`${fieldName}.mail`}>
            {({ field }) => (
              <Input
                label="Mail"
                state={mailError && mailTouched ? "error" : "default"}
                stateRelatedMessage={mailError}
                nativeInputProps={{ ...field, type: "email" }}
              />
            )}
          </Field>
        </div>
      </div>
    </div>
  );
}
