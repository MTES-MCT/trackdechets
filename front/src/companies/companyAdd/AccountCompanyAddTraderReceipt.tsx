import React from "react";
import { Field } from "formik";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import { Input } from "@codegouvfr/react-dsfr/Input";

/**
 * Trader receipt Formik fields for company creation
 */
export default function AccountCompanyAddTraderReceipt() {
  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <p className="fr-text--bold">Récépissé Négociant (optionnel)</p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-4">
          <Field name="traderReceiptNumber">
            {({ field }) => {
              return (
                <Input
                  label="Numéro de récépissé"
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
          <RedErrorMessage name="traderReceiptNumber" />
        </div>
        <div className="fr-col-4">
          <Field name="traderReceiptValidity">
            {({ field }) => {
              return (
                <Input
                  label="Limite de validité"
                  nativeInputProps={{
                    type: "date",
                    name: field.name,
                    checked: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur
                  }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="traderReceiptValidity" />
        </div>
        <div className="fr-col-2">
          <Field name="traderReceiptDepartment">
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
          <RedErrorMessage name="traderReceiptDepartment" />
        </div>
      </div>
    </div>
  );
}
