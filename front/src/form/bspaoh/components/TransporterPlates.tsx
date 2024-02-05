import React, { useMemo, useState, useEffect } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useReducer } from "react";
import { useFormContext } from "react-hook-form";

const SET_PLATE = "set_plate";
const ADD_PLATE = "add_plate";
const REMOVE_PLATE = "remove_plate";

function platesReducer(state, action) {
  switch (action.type) {
    case SET_PLATE:
      return { ...state, errorMessage: "", inputPlate: action.payload };
    case ADD_PLATE: {
      if (state.plates.includes(state.inputPlate)) {
        return {
          ...state,
          errorMessage: "Cette plaque déjà renseignée sur ce tranporteur"
        };
      }
      if (!state.inputPlate) {
        return { ...state, errorMessage: "Le numéro ne peut être vide" };
      }
      return {
        ...state,
        plates: [...state.plates, state.inputPlate],
        errorMessage: "",
        inputPlate: ""
      };
    }
    case REMOVE_PLATE: {
      const plates = [...state.plates];
      plates.splice(action.payload, 1);

      return {
        ...state,
        errorMessage: "",
        plates
      };
    }
  }
  throw Error("Unknown action: " + action.type);
}

export const PlatesWidget = ({
  maxPlates,
  fieldName
}: {
  maxPlates: number;
  fieldName: string;
}) => {
  const { setValue, watch } = useFormContext();

  // retrieve plates from global rhf context
  const plates = watch(fieldName);

  // initiate reducer with rhf value
  const [state, dispatch] = useReducer(
    platesReducer,
    {
      plates: [],
      inputPlate: ""
    },
    initialArgs => ({ ...initialArgs, plates })
  );

  // set rhf value from reducer state on each change
  useEffect(
    () => setValue(fieldName, state.plates),
    [fieldName, state, setValue]
  );

  // diable input when plates number > maxPlates
  const disabled = state.plates.filter(Boolean).length >= maxPlates;

  return (
    <>
      <label className="fr-label">Immatriculations</label>
      <div className="fr-grid-row fr-grid-row--bottom">
        {state.plates.map((plate, idx) => (
          <Tag
            dismissible
            key={idx}
            className="fr-mr-2v"
            nativeButtonProps={{
              type: "button",
              onClick: () => dispatch({ type: REMOVE_PLATE, payload: idx })
            }}
          >
            {plate}
          </Tag>
        ))}
        <Input
          label={null}
          className="fr-col-md-4"
          disabled={disabled}
          state={state.errorMessage && "error"}
          stateRelatedMessage={state.errorMessage}
          addon={
            <Button
              onClick={() => dispatch({ type: ADD_PLATE })}
              type="button"
              disabled={disabled}
            >
              Ajouter
            </Button>
          }
          nativeInputProps={{
            value: state.inputPlate ?? "",

            onChange: e =>
              dispatch({ type: SET_PLATE, payload: e.target.value }),
            onKeyPress: e => {
              if (e.key === "Enter") {
                dispatch({ type: ADD_PLATE });
              }
            }
          }}
        />
      </div>
    </>
  );
};

export const PlatesWidget2 = ({
  maxPlates,
  fieldName,
  setValue,
  watch
}: {
  maxPlates: number;
  fieldName: string;
  setValue: any;
  watch: any;
}) => {
  // retrieve plates from global rhf context
  const plates = watch(fieldName);

  // initiate reducer with rhf value
  const [state, dispatch] = useReducer(
    platesReducer,
    {
      plates: [],
      inputPlate: ""
    },
    initialArgs => ({ ...initialArgs, plates })
  );

  // set rhf value from reducer state on each change
  useEffect(
    () => setValue(fieldName, state.plates),
    [fieldName, state, setValue]
  );

  // disable input when plates number > maxPlates
  const disabled = state.plates.filter(Boolean).length >= maxPlates;

  return (
    <>
      <label className="fr-label">Immatriculations</label>
      <div className="fr-grid-row fr-grid-row--bottom">
        {state.plates.map((plate, idx) => (
          <Tag
            dismissible
            key={idx}
            className="fr-mr-2v"
            nativeButtonProps={{
              type: "button",
              onClick: () => dispatch({ type: REMOVE_PLATE, payload: idx })
            }}
          >
            {plate}
          </Tag>
        ))}
        <Input
          label={null}
          className="fr-col-md-4"
          disabled={disabled}
          state={state.errorMessage && "error"}
          stateRelatedMessage={state.errorMessage}
          addon={
            <Button
              onClick={() => dispatch({ type: ADD_PLATE })}
              type="button"
              disabled={disabled}
            >
              Ajouter
            </Button>
          }
          nativeInputProps={{
            value: state.inputPlate ?? "",

            onChange: e =>
              dispatch({ type: SET_PLATE, payload: e.target.value }),
            onKeyPress: e => {
              if (e.key === "Enter") {
                dispatch({ type: ADD_PLATE });
              }
            }
          }}
        />
      </div>
    </>
  );
};
