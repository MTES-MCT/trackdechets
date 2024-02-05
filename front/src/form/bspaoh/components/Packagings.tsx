import React, { useReducer, useEffect } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { useFormContext, useFieldArray } from "react-hook-form";
import { emptyPackaging } from "../initial-state";

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
const PaohPackaging = ({ idx, remove, paohType }) => {
  const { register, setValue, getValues } = useFormContext();
  const name = `waste.packagings.${idx}`;

  const [state, dispatch] = useReducer(packagingReducer, {
    codes: getValues(`${name}.identificationCodes`),
    inputCode: ""
  });

  useEffect(() => {
    setValue(`${name}.identificationCodes`, state.codes);
  }, [state, name, setValue]);

  return (
    <div>
      {idx > 0 && <hr />}
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom fr-mb-10v">
        <div className="fr-col-12 fr-col-md-3">
          <Select
            label="Type"
            nativeSelectProps={{ ...register(`${name}.type`) }}
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
            nativeInputProps={{ ...register(`${name}.volume`) }}
          ></Input>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <Input
            label="N° de contenants (optionnel)"
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
          {idx > 0 && (
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

          <div className="fr-grid-row fr-grid-row--bottom">
            {state.codes.map((code, idx) => (
              <Tag
                dismissible
                key={idx}
                className="fr-mr-2v"
                nativeButtonProps={{
                  type: "button",
                  onClick: () => dispatch({ type: REMOVE_CODE, payload: idx })
                }}
              >
                {code}
              </Tag>
            ))}
            <Input
              label={null}
              className="fr-col-md-4"
              addon={
                <Button
                  onClick={() => dispatch({ type: ADD_CODE })}
                  type="button"
                >
                  Ajouter
                </Button>
              }
              nativeInputProps={{
                value: state.inputCode,
                onChange: e =>
                  dispatch({ type: SET_INPUT_CODE, payload: e.target.value }),
                onKeyPress: e => {
                  if (e.key === "Enter") {
                    dispatch({ type: ADD_CODE });
                  }
                }
              }}
            />
          </div>
          <Badge severity="info" className="fr-mt-5v">
            Vous avez {state.codes.length} {paohType} pour ce contenant
          </Badge>
        </div>
      </div>
      <div className="fr-mt-10v">
        <RadioButtons
          orientation="horizontal"
          legend="Consistance"
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

export const PaohPackagings = ({ paohType }) => {
  const { fields, append, remove } = useFieldArray({
    name: "waste.packagings" // unique name for your Field Array
  });
  const { setValue, watch } = useFormContext();
  const packagings = watch("waste.packagings");
  useEffect(() => {
    setValue(`emitter.emission.waste.detail.quantity`, packagings.length);
  }, [packagings, setValue]);

  return (
    <div>
      <h3 className="fr-h3">Conditionnement</h3>
      {fields.map((packaging, index) => (
        <PaohPackaging
          idx={index}
          key={packaging.id}
          remove={remove}
          paohType={paohType}
        />
      ))}
      <div className="form__actions">
        <Button
          priority="secondary"
          type="button"
          onClick={() => append(emptyPackaging)}
        >
          Ajouter un conditionnement
        </Button>
      </div>
    </div>
  );
};
