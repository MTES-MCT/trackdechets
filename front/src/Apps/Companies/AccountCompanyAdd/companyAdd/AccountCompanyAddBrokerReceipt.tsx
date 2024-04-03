import React from "react";
import { Field } from "formik";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import { Input } from "@codegouvfr/react-dsfr/Input";

/**
 * Broker receipt Formik fields for company creation
 */
export default function AccountCompanyAddBrokerReceipt() {
  return (
    <div className="fr-container">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <p className="fr-text--bold">Récépissé Courtier (optionnel)</p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-4">
          <Field name="brokerReceiptNumber">
            {({ field }) => {
              return (
                <Input
                  label="Numéro de récépissé"
                  nativeInputProps={field}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="brokerReceiptNumber" />
        </div>
        <div className="fr-col-4">
          <Field name="brokerReceiptValidity">
            {({ field }) => {
              return (
                <Input
                  label="Limite de validité"
                  nativeInputProps={{ type: "date", ...field }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="brokerReceiptValidity" />
        </div>
        <div className="fr-col-2">
          <Field name="brokerReceiptDepartment">
            {({ field }) => {
              return (
                <Input
                  label="Département"
                  nativeInputProps={{ placeholder: "75", ...field }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="brokerReceiptDepartment" />
        </div>
      </div>
    </div>
  );
}
