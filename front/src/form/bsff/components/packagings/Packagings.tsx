import { IconClose } from "../../../../Apps/common/Components/Icons/Icons";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import NumberInput from "../../../common/components/custom-inputs/NumberInput";
import {
  Field,
  FieldArray,
  FieldProps,
  useField,
  useFormikContext
} from "formik";
import {
  BsffPackagingInput,
  BsffPackagingType,
  BsffType
} from "@td/codegen-ui";
import React, { InputHTMLAttributes, ChangeEvent } from "react";
import "./Packagings.scss";

export const PACKAGINGS_NAMES = {
  [BsffPackagingType.Bouteille]: "Bouteille",
  [BsffPackagingType.Citerne]: "Citerne",
  [BsffPackagingType.Conteneur]: "Conteneur",
  [BsffPackagingType.Autre]: "Autre"
};

export default function BsffPackagings({
  field: { name, value },
  disabled
}: FieldProps<BsffPackagingInput[]> & InputHTMLAttributes<HTMLInputElement>) {
  const [{ value: type }] = useField<BsffType>("type");

  const { setFieldValue } = useFormikContext<BsffPackagingInput>();

  const canEdit =
    !disabled && ![BsffType.Reexpedition, BsffType.Groupement].includes(type);

  const maxPackagings = type === BsffType.Reconditionnement ? 1 : Infinity;

  return (
    <div className="tw-mt-2">
      <FieldArray
        name={name}
        render={arrayHelpers => (
          <div>
            {value.map((p, idx) => {
              const fieldName = `${name}.${idx}`;

              return (
                <div
                  key={idx}
                  className="tw-border-2 tw-border-gray-400 tw-border-solid tw-rounded-md tw-px-4 tw-py-2 tw-mb-2"
                >
                  <div className="tw-flex tw-mb-4 tw-items-end">
                    <div className="tw-flex tw-items-end">
                      <div className="tw-flex-grow tw-px-2">
                        <label>
                          Type de contenant{" "}
                          <Field
                            as="select"
                            className="td-select"
                            name={`${fieldName}.type`}
                            disabled={!canEdit}
                            onChange={(v: ChangeEvent<HTMLInputElement>) => {
                              setFieldValue(
                                `${fieldName}.type`,
                                v.target.value
                              );
                              setFieldValue(`${fieldName}.other`, "");
                            }}
                          >
                            {Object.keys(PACKAGINGS_NAMES).map(p => (
                              <option key={p} value={p}>
                                {PACKAGINGS_NAMES[p]}
                              </option>
                            ))}
                          </Field>
                        </label>
                      </div>

                      <div className="tw-px-2">
                        <label>
                          Autre type, à préciser
                          <Field
                            className="td-input"
                            name={`${fieldName}.other`}
                            disabled={!canEdit || p.type !== "AUTRE"}
                          />
                        </label>
                      </div>

                      <div className="tw-px-2">
                        <label>
                          Numéro
                          <Field
                            className="td-input"
                            name={`${fieldName}.numero`}
                            disabled={!canEdit}
                          />
                        </label>
                      </div>

                      <div className="tw-px-2 tw-flex-shrink">
                        <label>
                          Volume du contenant en L
                          <Field
                            component={NumberInput}
                            className="td-input td-input--small"
                            name={`${fieldName}.volume`}
                            disabled={!canEdit}
                          />
                        </label>
                      </div>

                      <div className="tw-px-2 tw-flex-shrink">
                        <label>
                          Masse du contenu en kg
                          <Field
                            component={NumberInput}
                            className="td-input td-input--small"
                            name={`${fieldName}.weight`}
                            disabled={!canEdit}
                          />
                        </label>
                      </div>
                    </div>
                    {canEdit && (
                      <div
                        className="tw-px-2"
                        onClick={() => arrayHelpers.remove(idx)}
                      >
                        <button type="button">
                          <IconClose />
                        </button>
                      </div>
                    )}
                  </div>
                  <RedErrorMessage name={`${fieldName}.type`} />
                  <RedErrorMessage name={`${fieldName}.other`} />
                  <RedErrorMessage name={`${fieldName}.numero`} />
                  <RedErrorMessage name={`${fieldName}.volume`} />
                  <RedErrorMessage name={`${fieldName}.weight`} />
                  {typeof p.volume === "number" &&
                    p.weight > p.volume * 1.5 && (
                      <div className="notification notification--warning">
                        Le poids renseigné semble trop élevé au regard du volume
                        du contenant.
                      </div>
                    )}
                </div>
              );
            })}
            {canEdit && value.length < maxPackagings && (
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={() =>
                  arrayHelpers.push({
                    type: "BOUTEILLE",
                    numero: "",
                    other: "",
                    weight: 0,
                    volume: null
                  })
                }
              >
                Ajouter un contenant
              </button>
            )}
            {value.length >= maxPackagings && (
              <div className="notification">
                Un seul contenant est autorisé dans le cadre d'un
                reconditionnement. Ex. : 1 citerne
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
