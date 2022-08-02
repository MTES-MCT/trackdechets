import React from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsda, BsdaType } from "generated/graphql/types";
import { getInitialCompany } from "form/bsdd/utils/initial-state";

export function Destination({ disabled }) {
  const { values, setFieldValue } = useFormikContext<Bsda>();
  const hasNextDestination = Boolean(
    values.destination?.operation?.nextDestination
  );
  const isDechetterie = values?.type === BsdaType.Collection_2710;

  function onNextDestinationToggle() {
    // When we toggle the next destination switch, we swap destination <-> nextDestination
    // That's because the final destination is always displayed first:
    // - when it's a "simple" bsda, `destination.company` is displayed at the top
    // - otherwise, `destination.operation.nextDestination` is displayed first
    if (hasNextDestination) {
      const nextDestination =
        values.destination?.operation?.nextDestination?.company;
      setFieldValue("destination.operation.nextDestination", null);
      setFieldValue("destination.company", nextDestination, false);
    } else {
      const destination = values.destination?.company;
      setFieldValue("destination.company", getInitialCompany(), false);
      setFieldValue(
        "destination.operation.nextDestination",
        {
          company: destination,
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

      {isDechetterie ? (
        <div className="form__row">
          <div className="notification">
            Vous effectuez une collecte en déchetterie. Il n'y a pas de
            destination à saisir, votre entreprise a été automatiquement
            sélectionnée.
          </div>
          <div className="form__row">
            <label>
              Personne à contacter
              <Field
                type="text"
                name="destination.company.contact"
                className="td-input"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Téléphone
              <Field
                type="text"
                name="destination.company.phone"
                className="td-input td-input--small"
                disabled={disabled}
              />
            </label>
          </div>
          <div className="form__row">
            <label>
              Mail
              <Field
                type="text"
                name="destination.company.mail"
                className="td-input td-input--medium"
                disabled={disabled}
              />
            </label>
          </div>
        </div>
      ) : (
        <CompanySelector
          disabled={disabled}
          name={
            hasNextDestination
              ? "destination.operation.nextDestination.company"
              : "destination.company"
          }
          heading="Installation de destination finale (exutoire)"
        />
      )}

      {!isDechetterie && (
        <div className="form__row">
          <label>
            N° CAP:
            <Field
              disabled={disabled}
              type="text"
              name={
                hasNextDestination
                  ? "destination.operation.nextDestination.cap"
                  : "destination.cap"
              }
              className="td-input td-input--medium"
            />
          </label>
        </div>
      )}

      <div className="form__row">
        <label>Opération d’élimination / valorisation prévue (code D/R)</label>
        <Field
          as="select"
          name={
            hasNextDestination
              ? "destination.operation.nextDestination.plannedOperationCode"
              : "destination.plannedOperationCode"
          }
          className="td-select"
          disabled={disabled}
        >
          <option />
          {isDechetterie ? (
            <>
              <option value="R 13">
                R 13 - Opérations de transit incluant le groupement sans
                transvasement préalable à R 5
              </option>
              <option value="D 15">
                D 15 - Transit incluant le groupement sans transvasement
              </option>
            </>
          ) : (
            <>
              <option value="R 5">
                R 5 - Recyclage ou récupération d'autres matières inorganiques.
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

      <div className="tw-mt-8 tw-pt-6 tw-border-t-2">
        <div className="form__row">
          <label>
            <input
              type="checkbox"
              onChange={onNextDestinationToggle}
              disabled={disabled}
              checked={hasNextDestination}
              className="td-checkbox"
            />
            Je souhaite ajouter une installation intermédiaire de transit ou de
            groupement d'amiante
          </label>
        </div>

        {hasNextDestination && (
          <>
            <CompanySelector
              disabled={disabled}
              name="destination.company"
              heading="Installation de transit ou de groupement"
            />

            <div className="form__row">
              <label>
                N° CAP: (optionnel)
                <Field
                  disabled={disabled}
                  type="text"
                  name="destination..cap"
                  className="td-input td-input--medium"
                />
              </label>
            </div>

            <div className="form__row">
              <label>
                Opération d"élimination / valorisation prévue (code D/R)
              </label>
              <Field
                as="select"
                name="destination.plannedOperationCode"
                className="td-select"
                disabled={disabled}
              >
                <option />
                <option value="R 13">
                  R 13 - Opérations de transit incluant le groupement sans
                  transvasement préalable à R 5
                </option>
                <option value="D 15">
                  D 15 - Transit incluant le groupement sans transvasement
                </option>
              </Field>
            </div>
          </>
        )}
      </div>
    </>
  );
}
