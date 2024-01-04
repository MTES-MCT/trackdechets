import React, { useEffect, useState } from "react";
import { Field, useFormikContext } from "formik";
import { RedErrorMessage } from "../../common/components";
import CompanySelector from "../common/components/company/CompanySelector";
import { RadioButton } from "../common/components/custom-inputs/RadioButton";
import Operation from "./Operation";
import { Bsvhu, CompanySearchResult } from "@td/codegen-ui";

export default function Destination({ disabled }) {
  const [selectedDestination, setSelectedDestination] =
    useState<CompanySearchResult | null>(null);
  const { setFieldValue, values } = useFormikContext<Bsvhu>();

  const isDangerousWasteCode = values.wasteCode === "16 01 04*";
  useEffect(() => {
    if (isDangerousWasteCode) {
      setFieldValue("destination.type", "DEMOLISSEUR");
    }
  }, [isDangerousWasteCode, setFieldValue]);

  const updateAgrementNumber = (destination, type?) => {
    const destinationType = type || values.destination?.type;

    const agrementNumber =
      destinationType === "BROYEUR"
        ? destination?.vhuAgrementBroyeur?.agrementNumber
        : destination?.vhuAgrementDemolisseur?.agrementNumber;

    if (agrementNumber) {
      setFieldValue("destination.agrementNumber", agrementNumber);
    } else {
      setFieldValue("destination.agrementNumber", "");
    }
  };

  const onChangeDestinationType = type => {
    setFieldValue("destination.type", type);
    updateAgrementNumber(selectedDestination, type);
  };

  return (
    <>
      {disabled && (
        <>
          <Operation />
          <div className="notification notification--error">
            Les champs ci-dessous ont été scellés via signature et ne sont plus
            modifiables.
          </div>
        </>
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
            name="destination.type"
            id="BROYEUR"
            label="Broyeur agréé"
            component={RadioButton}
            disabled={isDangerousWasteCode || disabled}
            onChange={() => {
              onChangeDestinationType("BROYEUR");
            }}
          />
          <Field
            name="destination.type"
            id="DEMOLISSEUR"
            label="Démolisseur agréé"
            component={RadioButton}
            disabled={isDangerousWasteCode || disabled}
            onChange={() => {
              onChangeDestinationType("DEMOLISSEUR");
            }}
          />
        </fieldset>

        <RedErrorMessage name="destination.type" />
      </div>

      <CompanySelector
        disabled={disabled}
        name="destination.company"
        heading="Installation de destination"
        registeredOnlyCompanies={true}
        onCompanySelected={destination => {
          setSelectedDestination(destination as CompanySearchResult);
          updateAgrementNumber(destination);
        }}
      />

      <div className="form__row">
        <label>
          Numéro d'agrément
          <Field
            type="text"
            name="destination.agrementNumber"
            className="td-input"
            disabled={disabled}
          />
        </label>

        <RedErrorMessage name="destination.agrementNumber" />
      </div>

      <div className="form__row">
        <label>Opération d’élimination / valorisation prévue (code D/R)</label>
        <Field
          as="select"
          name="destination.plannedOperationCode"
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

      {values.destination?.type === "DEMOLISSEUR" && (
        <CompanySelector
          disabled={disabled}
          name="destination.operation.nextDestination.company"
          heading="Installation de broyage prévisionelle"
          onCompanySelected={destination => {
            const agrementNumber =
              values.destination?.type === "BROYEUR"
                ? (destination as CompanySearchResult)?.vhuAgrementBroyeur
                    ?.agrementNumber
                : (destination as CompanySearchResult)?.vhuAgrementDemolisseur
                    ?.agrementNumber;

            if (agrementNumber) {
              setFieldValue("destination.agrementNumber", agrementNumber);
            } else {
              setFieldValue("destination.agrementNumber", "");
            }
          }}
        />
      )}
    </>
  );
}
