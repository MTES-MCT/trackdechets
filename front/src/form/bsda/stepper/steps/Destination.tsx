import React from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsda } from "generated/graphql/types";
import { getInitialCompany } from "form/bsdd/utils/initial-state";

export function Destination({ disabled }) {
  const { values, setFieldValue } = useFormikContext<Bsda>();
  const hasNextDestination = Boolean(
    values.destination?.operation?.nextDestination
  );
  const isDechetterie = values.type === "COLLECTION_2710";

  function onNextDestinationToggle() {
    if (hasNextDestination) {
      setFieldValue("destination.operation.nextDestination", null);
    } else {
      setFieldValue(
        "destination.operation.nextDestination",
        {
          company: getInitialCompany(),
        },
        false
      );
    }
  }

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
            onChange={onNextDestinationToggle}
            disabled={disabled}
            checked={hasNextDestination}
            className="td-checkbox"
          />
          La destination indiquée n’est pas l’exutoire final
        </label>
      </div>

      {!isDechetterie && (
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
      )}

      <div className="form__row">
        <label>Opération d’élimination / valorisation prévue (code D/R)</label>
        <Field
          as="select"
          name="destination.plannedOperationCode"
          className="td-select"
          disabled={disabled}
        >
          <option />
          {hasNextDestination || isDechetterie ? (
            <>
              <option value="R 12">
                R 12 - Echange de déchets en vue de les soumettre à l'une des
                opération R1 à R11
              </option>
              <option value="D 13">D 13 - Groupement de déchets</option>
              <option value="D 15">D 15 - Entreposage provisoire</option>
            </>
          ) : (
            <>
              <option value="R 5">
                R 5 - Recyclage ou récupération d’autres matières inorganiques.
              </option>
              <option value="D 5">
                D 5 - Mise en décharge aménagée et autorisée en ISDD ou ISDND
              </option>
              <option value="D 9">
                D 9 - Vitrification, traitement chimique ou prétraitement
              </option>
            </>
          )}
        </Field>
      </div>

      {hasNextDestination && (
        <>
          <CompanySelector
            disabled={disabled}
            name="destination.operation.nextDestination.company"
            heading="Exutoire final prévu"
          />

          <div className="form__row">
            <label>
              N° CAP:
              <Field
                disabled={disabled}
                type="text"
                name="destination.operation.nextDestination.cap"
                className="td-input td-input--medium"
              />
            </label>
          </div>

          <div className="form__row">
            <label>
              Opération d’élimination / valorisation prévue (code D/R)
            </label>
            <Field
              as="select"
              name="destination.operation.nextDestination.plannedOperationCode"
              className="td-select"
              disabled={disabled}
            >
              <option />
              <option value="R 5">
                R 5 - Recyclage ou récupération d’autres matières inorganiques.
              </option>
              <option value="D 5">
                D 5 - Mise en décharge aménagée et autorisée en ISDD ou ISDND
              </option>
              <option value="D 9">
                D 9 - Vitrification, traitement chimique ou prétraitement
              </option>
              <option value="R 12">
                R 12 - Echange de déchets en vue de les soumettre à l'une des
                opération R1 à R11
              </option>
              <option value="D 13">D 13 - Groupement de déchets</option>
              <option value="D 15">D 15 - Entreposage provisoire</option>
            </Field>
          </div>
        </>
      )}
    </>
  );
}
