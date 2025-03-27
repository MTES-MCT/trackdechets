import {
  Field,
  FieldArray,
  FieldArrayRenderProps,
  FieldProps,
  useFormikContext
} from "formik";
import React, { useMemo, lazy } from "react";
import TdSwitch from "../../../../common/components/Switch";
import { Form, ParcelNumber } from "@td/codegen-ui";
import Tooltip from "../../../../common/components/Tooltip";
import { IconDelete1 } from "../../../../Apps/common/Components/Icons/Icons";
const TagsInput = lazy(
  () => import("../../../../common/components/tags-input/TagsInput")
);

const newParcelNumber = {
  city: "",
  postalCode: "",
  prefix: "",
  number: "",
  section: ""
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
        label="Je souhaite ajouter une parcelle cadastrale pour la traçabilité des terres et sédiments (optionnel)"
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
        <label htmlFor="wasteDetails.landIdentifiers">
          Identifiant(s) du terrain lorsque les terres ont été extraites d'un
          terrain placé en secteur d'information sur les sols au titre de
          l'article L. 125-6 (optionnel)
          <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
        </label>
        <TagsInput name="wasteDetails.landIdentifiers" />
      </div>

      <div className="form__row">
        <label htmlFor="wasteDetails.analysisReferences">
          Références d'analyses (optionnel)
          <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
        </label>
        <TagsInput name="wasteDetails.analysisReferences" />
      </div>
    </div>
  );
}

function ParcelDetails({ index, parcelNumber, arrayHelpers }) {
  const showParcelNumber = useMemo(() => {
    return (
      parcelNumber.prefix ||
      parcelNumber.section ||
      parcelNumber.number ||
      !("x" in parcelNumber)
    );
  }, [parcelNumber]);

  function handleGpsToggle(
    parcelNumber: ParcelNumber,
    index: number,
    arrayHelpers: FieldArrayRenderProps
  ) {
    if (showParcelNumber) {
      arrayHelpers.replace(index, {
        city: parcelNumber.city,
        postalCode: parcelNumber.postalCode,
        x: 0,
        y: 0
      });
    } else {
      arrayHelpers.replace(index, {
        city: parcelNumber.city,
        postalCode: parcelNumber.postalCode,
        prefix: "",
        number: "",
        section: ""
      });
    }
  }

  return (
    <>
      <div className="form__row">
        {showParcelNumber ? (
          <ParcelCadastral index={index} />
        ) : (
          <ParcelGps index={index} />
        )}
      </div>
      <div className="form__row">
        <TdSwitch
          checked={!showParcelNumber}
          onChange={() => handleGpsToggle(parcelNumber, index, arrayHelpers)}
          label="Le domaine n'est pas cadastré, je n'ai pas les numéros de parcelle,
          j'indique les coordonnées GPS (au format WGS 84)"
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
        numéro à partir d'une adresse, rendez-vous sur{" "}
        <a
          href="https://cadastre.data.gouv.fr/map"
          target="_blank"
          className="fr-link force-external-link-content force-underline-link"
          rel="noreferrer"
        >
          le site du cadastre
        </a>
        , ou{" "}
        <a
          href="https://errial.georisques.gouv.fr/#/"
          target="_blank"
          className="fr-link force-external-link-content force-underline-link"
          rel="noreferrer"
        >
          le site Errial
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
          Coordonnée latitude au format WGS 84 (entre -90° et 90°)
          <Field
            type="number"
            name={`wasteDetails.parcelNumbers.${index}.x`}
            className="td-input td-input--medium"
          />
        </label>
      </div>
      <div className="form__row">
        <label>
          Coordonnée longitude au format WGS 84 (entre -180° et 180°)
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
