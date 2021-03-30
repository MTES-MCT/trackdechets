import { RedErrorMessage } from "common/components";
import CompanySelector from "form/common/components/company/CompanySelector";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import { Field, useFormikContext } from "formik";
import React from "react";
import { Bsvhu } from "generated/graphql/types";

export default function Recipient({ disabled }) {
  const { setFieldValue, values } = useFormikContext<Bsvhu>();

  const isDangerousWasteCode = values.wasteCode === "16 01 04*";
  if (isDangerousWasteCode) {
    setFieldValue("recipient.type", "DEMOLISSEUR");
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scéllés via signature et ne sont plus
          modifiables.
        </div>
      )}
      <div className="form__row">
        {isDangerousWasteCode && (
          <div className="notification success tw-mb-2">
            Vous avez saisi le code déchet dangereux <strong>16 01 04*</strong>.
            Le destinataire est obligatoirement un démolisseur agréé.
          </div>
        )}

        <fieldset>
          <legend>L'installation de destination est un</legend>
          <Field
            name="recipient.type"
            id="BROYEUR"
            label="Broyeur agréé"
            component={RadioButton}
            disabled={isDangerousWasteCode || disabled}
          />
          <Field
            name="recipient.type"
            id="DEMOLISSEUR"
            label="Démolisseur agréé"
            component={RadioButton}
            disabled={isDangerousWasteCode || disabled}
          />
        </fieldset>

        <RedErrorMessage name="recipient.type" />
      </div>

      <CompanySelector
        disabled={disabled}
        name="recipient.company"
        heading="Installation de destination"
        onCompanySelected={recipient => {
          const agrementNumber =
            values.recipient?.type === "BROYEUR"
              ? recipient?.vhuAgrementBroyeur?.agrementNumber
              : recipient?.vhuAgrementDemolisseur?.agrementNumber;

          if (agrementNumber) {
            setFieldValue("recipient.agrementNumber", agrementNumber);
          } else {
            setFieldValue("recipient.agrementNumber", "");
          }
        }}
      />

      <div className="form__row">
        <label>
          Numéro d'agrément
          <Field
            type="text"
            name="recipient.agrementNumber"
            className="td-input"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="recipient.agrementNumber" />
      </div>

      <div className="form__row">
        <label>Opération d’élimination / valorisation prévue (code D/R)</label>
        <Field
          as="select"
          name="recipient.operation.planned"
          className="td-select"
          disabled={disabled}
        >
          <option value="R 4">
            R 4 - Recyclage ou récupération des métaux et des composés
            métalliques
          </option>
          <option value="R 12">
            R 12 - Échange de déchets en vue de les soumettre à l'une des
            opérations numérotées R1 à R11
          </option>
        </Field>
      </div>

      {values.recipient?.type === "DEMOLISSEUR" && (
        <CompanySelector
          disabled={disabled}
          name="recipient.plannedBroyeurCompany"
          heading="Installation de broyage prévisionelle"
          onCompanySelected={recipient => {
            const agrementNumber =
              values.recipient?.type === "BROYEUR"
                ? recipient?.vhuAgrementBroyeur?.agrementNumber
                : recipient?.vhuAgrementDemolisseur?.agrementNumber;

            if (agrementNumber) {
              setFieldValue("recipient.agrementNumber", agrementNumber);
            } else {
              setFieldValue("recipient.agrementNumber", "");
            }
          }}
        />
      )}
    </>
  );
}
