import React, { useReducer, useEffect, useRef } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import styles from "./Packagings.module.scss";
import { useFormContext, useFieldArray } from "react-hook-form";
import { emptyPackaging } from "../initial-state";
import classNames from "classnames";

const SET_INPUT_CODE = "set_input_code";
const ADD_CODE = "add_code";
const REMOVE_CODE = "remove_code";

function packagingReducer(state, action) {
  switch (action.type) {
    case SET_INPUT_CODE:
      return { ...state, inputCode: action.payload };
    case ADD_CODE: {
      if (!state.inputCode || state.codes.includes(state.inputCode)) {
        return state;
      }
      return {
        ...state,
        codes: [...state.codes, state.inputCode],
        inputCode: ""
      };
    }
    case REMOVE_CODE: {
      const codes = [...state.codes];
      codes.splice(action.payload, 1);

      return {
        ...state,
        codes
      };
    }
  }
  throw Error("Unknown action: " + action.type);
}
const PaohPackaging = ({ idx, remove, paohType, disabled }) => {
  const { register, setValue, getValues, getFieldState } = useFormContext();
  const name = `waste.packagings.${idx}`;
  const tagInputRef = useRef<HTMLInputElement>(null);

  const onClear = () => {
    if (disabled) {
      return;
    }
    if (tagInputRef?.current?.value) {
      tagInputRef.current.value = "";
    }
  };

  const setTag = () => {
    if (disabled) {
      return;
    }
    dispatch({ type: ADD_CODE });
    onClear();
  };

  const [state, dispatch] = useReducer(packagingReducer, {
    codes: getValues(`${name}.identificationCodes`),
    inputCode: ""
  });

  useEffect(() => {
    setValue(`${name}.identificationCodes`, state.codes);
  }, [state, name, setValue]);

  const { error: typeError } = getFieldState(`${name}.type`);
  const { error: consistenceError } = getFieldState(`${name}.consistence`);
  const { error: identificationCodesError } = getFieldState(
    `${name}.identificationCodes`
  );

  return (
    <div>
      {idx > 0 && <hr />}
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-10v">
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Type"
            disabled={disabled}
            nativeSelectProps={{ ...register(`${name}.type`) }}
            state={typeError && "error"}
            stateRelatedMessage={(typeError?.message as string) ?? ""}
          >
            <option value="">…</option>

            {paohType === "PAOH" ? (
              <>
                <option value="LITTLE_BOX">Petite boîte</option>
                <option value="BIG_BOX">Grande boîte</option>
              </>
            ) : null}
            {paohType === "FOETUS" ? (
              <option value="RELIQUAIRE">Reliquaire</option>
            ) : null}
          </Select>
        </div>
        <div className="fr-col-12 fr-col-md-2">
          <Input
            label="Volume (opt)"
            disabled={disabled}
            nativeInputProps={{
              ...register(`${name}.volume`),
              inputMode: "numeric",
              pattern: "[0-9]*",
              type: "number"
            }}
          ></Input>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <Input
            label="N° de contenant (optionnel)"
            disabled={disabled}
            nativeInputProps={{ ...register(`${name}.containerNumber`) }}
          ></Input>
        </div>
        <div className="fr-col-12 fr-col-md-1">
          <Input
            disabled={true}
            label="Unité(s)"
            nativeInputProps={{ defaultValue: 1 }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-1">
          {idx > 0 && !disabled && (
            <Button
              priority="tertiary"
              type="button"
              iconId="fr-icon-delete-bin-line"
              title="Supprimer ce conditionnement"
              nativeButtonProps={{ onClick: () => remove(idx) }}
            />
          )}
        </div>
      </div>

      <div className="fr-mt-5v">
        <div className="fr-mt-3v">
          <p className="f fr-mb-1v">
            Codes d'identification utilisés par l'établissement
          </p>

          <div
            className={classNames(
              "fr-grid-row fr-grid-row--bottom",
              styles.multiTags
            )}
          >
            {state.codes.map((code, idx) => (
              <Tag
                dismissible
                key={idx}
                className="fr-mr-2v"
                nativeButtonProps={{
                  type: "button",
                  onClick: () =>
                    !disabled && dispatch({ type: REMOVE_CODE, payload: idx })
                }}
              >
                {code}
              </Tag>
            ))}

            {!disabled && (
              <input
                type="text"
                ref={tagInputRef}
                placeholder="Code…"
                className={styles.multiTagsInput}
                onChange={e =>
                  dispatch({ type: SET_INPUT_CODE, payload: e.target.value })
                }
                onKeyUp={e => {
                  if (e.key === "Enter") {
                    setTag();
                  }
                }}
                onBlur={() => {
                  setTag();
                }}
              />
            )}
          </div>

          <p
            className={`${
              identificationCodesError ? "fr-error-text" : "fr-info-text"
            } fr-mt-5v`}
          >
            Vous avez {state.codes.length} {paohType} pour ce contenant
          </p>
        </div>
      </div>
      <div className="fr-mt-10v">
        <RadioButtons
          orientation="horizontal"
          disabled={disabled}
          legend="Consistance"
          state={consistenceError && "error"}
          stateRelatedMessage={(consistenceError?.message as string) ?? ""}
          options={[
            {
              label: "Solide",
              nativeInputProps: {
                ...register(`${name}.consistence`),
                value: "SOLIDE"
              }
            },
            {
              label: "Liquide",
              nativeInputProps: {
                ...register(`${name}.consistence`),
                value: "LIQUIDE"
              }
            }
          ]}
        />
      </div>
    </div>
  );
};

export const PaohPackagings = ({ paohType, disabled = false }) => {
  const { fields, append, remove } = useFieldArray({
    name: "waste.packagings"
  });
  const { setValue, watch } = useFormContext();

  const packagings = watch("waste.packagings");

  useEffect(() => {
    setValue(`emitter.emission.detail.quantity`, packagings.length);
  }, [packagings, setValue]);

  return (
    <div>
      <h3 className="fr-h3">Conditionnement</h3>
      {fields.map((packaging, index) => (
        <PaohPackaging
          idx={index}
          key={packaging.id}
          remove={remove}
          disabled={disabled}
          paohType={paohType}
        />
      ))}
      {!disabled && (
        <div className="form__actions">
          <Button
            priority="secondary"
            type="button"
            onClick={() => append(emptyPackaging)}
          >
            Ajouter un conditionnement
          </Button>
        </div>
      )}
    </div>
  );
};
