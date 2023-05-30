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
                Ce profil comprend uniquement les professionnels avec récépissé.
                Les exemptions de récépissé n'ont pas à utiliser ce profil.{" "}
                <a
                  href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044266537/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Article R.541-50 du code de l'environnement
                </a>
                .
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
                  nativeInputProps={field}
                ></Input>
              );
            }}
          </Field>
          <RedErrorMessage name="transporterReceiptNumber" />
        </div>
        <div className="fr-col-4">
          <Field name="transporterReceiptValidity">
            {({ field }) => {
              return (
                <Input
                  label="Limite de validité"
                  nativeInputProps={{ type: "date", ...field }}
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
                  nativeInputProps={{ placeholder: "75", ...field }}
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
