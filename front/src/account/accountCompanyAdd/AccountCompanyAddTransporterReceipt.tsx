import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

/**
 * Transporter receipt Formik fields for company creation
 */
export default function AccountCompanyAddTransporterReceipt() {
  return (
    <div className="fr-container">
      <div className="fr-grid-row fr-mb-2w">
        <div className="fr-col-12">
          <Alert
            title=""
            description={
              <>
                Ce profil comprend les entreprises de transport routier,
                immatriculées au registre national des transports, et les
                établissements disposant d'une flotte en propre, disposant dans
                les 2 cas d'un récépissé de déclaration de transport de déchets
                ou qui répondent à l'exemption de récépissé.
              </>
            }
            severity="info"
          />
        </div>
      </div>
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <p className="fr-text--bold">Récépissé Transporteur (optionnel)</p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-4">
          <Field name="transporterReceiptNumber">
            {({ field }) => {
              return (
                <Input
                  label="Numéro de récépissé"
                  nativeInputProps={{
                    name: field.name,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                  }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="transporterReceiptNumber" />
        </div>
        <div className="fr-col-4">
          <Field name="transporterReceiptValidity">
            {({ field }) => {
              const minDate = new Date().toISOString().split("T")[0];
              return (
                <Input
                  label="Limite de validité"
                  nativeInputProps={{
                    type: "date",
                    min: minDate,
                    name: field.name,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                  }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="transporterReceiptValidity" />
        </div>
        <div className="fr-col-2">
          <Field name="transporterReceiptDepartment">
            {({ field }) => {
              return (
                <Input
                  label="Département"
                  nativeInputProps={{
                    placeholder: "75",
                    name: field.name,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                  }}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="transporterReceiptDepartment" />
        </div>
      </div>
    </div>
  );
}
