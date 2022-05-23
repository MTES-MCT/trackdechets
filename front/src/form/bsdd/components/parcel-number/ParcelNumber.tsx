import {
  Field,
  FieldArray,
  FieldArrayRenderProps,
  FieldProps,
  useFormikContext,
} from "formik";
import React, { useMemo } from "react";
import TdSwitch from "common/components/Switch";
import { Form, ParcelNumber } from "generated/graphql/types";
import TagsInput from "common/components/tags-input/TagsInput";
import Tooltip from "common/components/Tooltip";
import { IconDelete1 } from "common/components/Icons";

const newParcelNumber = {
  city: "",
  postalCode: "",
  prefix: "",
  number: "",
  section: "",
  x: null,
  y: null,
};
export function ParcelNumbersSelector({ field }: FieldProps) {
  const { setFieldValue } = useFormikContext<Form>();
  const values: ParcelNumber[] = field.value ?? [];
  const showParcelNumberSelector = values.length > 0;

  function handleparcelNumberToggle() {
    if (showParcelNumberSelector) {
      setFieldValue(field.name, null, false);
    } else {
      setFieldValue(field.name, [newParcelNumber], false);
    }
  }

  return (
    <div>
      <TdSwitch
        checked={showParcelNumberSelector}
        onChange={handleparcelNumberToggle}
        label="Je souhaite ajouter une parcelle cadastrale pour la traçabilité des terres et sédiments"
      />

      {showParcelNumberSelector && (
        <FieldArray
          name={field.name}
          render={arrayHelpers => (
            <div>
              {values.map((parcelNumber, index) => (
                <div
                  className="tw-p-4 tw-mb-4 tw-border-2 tw-rounded"
                  key={index}
                >
                  <div className="tw-float-right tw-m-4">
                    <button
                      type="button"
                      onClick={() => arrayHelpers.remove(index)}
                      aria-label="Supprimer"
                    >
                      <IconDelete1 aria-hidden />
                    </button>
                  </div>
                  <div className="form__row">
                    <label>
                      Commune sur laquelle se trouve la parcelle
                      <Field
                        type="text"
                        name={`wasteDetails.parcelNumbers.${index}.city`}
                        className="td-input td-input--medium"
                      />
                    </label>
                  </div>
                  <div className="form__row">
                    <label>
                      Code postal
                      <Field
                        type="text"
                        name={`wasteDetails.parcelNumbers.${index}.postalCode`}
                        className="td-input td-input--small"
                      />
                    </label>
                  </div>

                  <ParcelDetails {...{ index, parcelNumber, arrayHelpers }} />
                </div>
              ))}
              <div className="form__row">
                <button
                  className="btn btn--outline-primary btn--small"
                  type="button"
                  onClick={() => arrayHelpers.push(newParcelNumber)}
                >
                  Ajouter un numéro de parcelle
                </button>
              </div>
            </div>
          )}
        />
      )}

      <div className="form__row">
        <label>
          Références d'analyses
          <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
          <TagsInput name="wasteDetails.analysisReferences" />
        </label>
      </div>
    </div>
  );
}

function ParcelDetails({ index, parcelNumber, arrayHelpers }) {
  const showParcelNumberGps = useMemo(() => {
    return (
      !parcelNumber.prefix &&
      !parcelNumber.section &&
      !parcelNumber.number &&
      parcelNumber.x !== null &&
      parcelNumber.y !== null
    );
  }, [parcelNumber]);

  function handleGpsToggle(
    parcelNumber: ParcelNumber,
    index: number,
    arrayHelpers: FieldArrayRenderProps
  ) {
    if (showParcelNumberGps) {
      arrayHelpers.replace(index, {
        ...newParcelNumber,
        city: parcelNumber.city,
        postalCode: parcelNumber.postalCode,
        x: null,
        y: null,
      });
    } else {
      arrayHelpers.replace(index, {
        ...newParcelNumber,
        city: parcelNumber.city,
        postalCode: parcelNumber.postalCode,
        x: 0,
        y: 0,
      });
    }
  }

  return (
    <>
      <div className="form__row">
        {showParcelNumberGps ? (
          <ParcelGps index={index} />
        ) : (
          <ParcelCadastral index={index} />
        )}
      </div>
      <div className="form__row">
        <TdSwitch
          checked={showParcelNumberGps}
          onChange={() => handleGpsToggle(parcelNumber, index, arrayHelpers)}
          label="Le domaine n'est pas cadastré, je n'ai pas les numéros de parcelle,
          j'indique les coordonnées GPS (au format lambert II étendu)"
        />
      </div>
    </>
  );
}

function ParcelCadastral({ index }) {
  return (
    <div>
      <p>
        Si le numéro dont vous disposez ressemble à "000-AB-25", 000 est le
        prefixe, AB la section, et 25 le numéro de parcelle. Pour retrouver le
        numéro à partir d'une adresse, rendez-vous sur le site{" "}
        <a href="https://errial.georisques.gouv.fr/#/" className="tw-underline">
          Errial
        </a>
      </p>
      <div className="tw-flex tw-justify-between">
        <div className="form__row">
          <label>
            Prefixe
            <Field
              type="text"
              name={`wasteDetails.parcelNumbers.${index}.prefix`}
              className="td-input td-input--small"
            />
          </label>
        </div>
        <div className="form__row">
          <label>
            Section
            <Field
              type="text"
              name={`wasteDetails.parcelNumbers.${index}.section`}
              className="td-input td-input--small"
            />
          </label>
        </div>
        <div className="form__row">
          <label>
            Numéro de parcelle
            <Field
              type="text"
              name={`wasteDetails.parcelNumbers.${index}.number`}
              className="td-input td-input--small"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ParcelGps({ index }) {
  return (
    <div>
      <div className="form__row">
        <label>
          Coordonnée X (Lambert II étendu)
          <Field
            type="number"
            name={`wasteDetails.parcelNumbers.${index}.x`}
            className="td-input td-input--medium"
          />
        </label>
      </div>
      <div className="form__row">
        <label>
          Coordonnée Y (Lambert II étendu)
          <Field
            type="number"
            name={`wasteDetails.parcelNumbers.${index}.y`}
            className="td-input td-input--medium"
          />
        </label>
      </div>
    </div>
  );
}
