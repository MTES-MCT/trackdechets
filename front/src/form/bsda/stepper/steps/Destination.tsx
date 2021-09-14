import React, { useState } from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsda } from "generated/graphql/types";

export function Destination({ disabled }) {
  const { values } = useFormikContext<Bsda>();
  const [hasNextDestination, setHasNextDestination] = useState(
    Boolean(values.destination?.operation?.nextDestination?.company?.siret)
  );

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}
      <CompanySelector
        disabled={disabled}
        name="destination.company"
        heading="Entreprise de destination"
      />

      <div className="form__row">
        <label>
          <input
            type="checkbox"
            onChange={() => setHasNextDestination(!hasNextDestination)}
            disabled={disabled}
            checked={hasNextDestination}
            className="td-checkbox"
          />
          La destination indiquée n’est pas l’exutoire final
        </label>
      </div>

      {hasNextDestination && (
        <>
          <CompanySelector
            disabled={disabled}
            name="destination.operation.nextDestination.company"
            heading="Exutoire final prévu"
          />
        </>
      )}

      <div className="form__row">
        <label>
          N° CAP:
          <Field
            disabled={disabled}
            type="text"
            name="destination.cap"
            className="td-input td-input--medium"
          />
        </label>
      </div>

      <div className="form__row">
        <label>Opération d’élimination / valorisation prévue (code D/R)</label>
        <Field
          as="select"
          name="destination.plannedOperationCode"
          className="td-select"
          disabled={disabled}
        >
          <option />
          <option value="D 5">
            D 5 - Mise en décharge aménagée et autorisée en ISDD
          </option>
          <option value="D 5">
            D 5 - Mise en décharge aménagée et autorisée en ISDND
          </option>
          <option value="D 9">D 9 - Vitrification</option>
          <option value="D 9">D 9 - Traitement chimique</option>
          <option value="D 9">D 9 - Prétraitement</option>
          <option value="D 13">D 13 - Groupement de déchets</option>
          <option value="D 15">D 15 - Entreposage provisoire</option>
        </Field>
      </div>
    </>
  );
}
