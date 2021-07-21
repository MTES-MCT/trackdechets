import React, { useEffect, useState } from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";

export function Destination({ disabled }) {
  const [hasNextDestination, setHasNextDestination] = useState(Boolean(false)); // TODO after rebase: Boolean(values.destination.operation.nextDestination.company.siret != null)

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
    </>
  );
}
