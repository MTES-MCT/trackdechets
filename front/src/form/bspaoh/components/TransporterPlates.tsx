import React, { useEffect, useReducer } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { Tag } from "@codegouvfr/react-dsfr/Tag";

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
        return state;
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
  fieldName,
  setValue,
  watch,
  disabled = false
}: {
  maxPlates: number;
  fieldName: string;
  setValue: any;
  watch: any;
  disabled?: boolean;
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

  // hide input when plates number > maxPlates
  const displayInput = state.plates.filter(Boolean).length < maxPlates;

  return (
    <>
      <p className="fr-label">Immatriculations</p>
      <div className="fr-grid-row fr-grid-row--bottom">
        {state.plates.map((plate, idx) => (
          <Tag
            dismissible
            key={idx}
            className="fr-mr-2v"
            nativeButtonProps={{
              type: "button",
              onClick: () =>
                !disabled && dispatch({ type: REMOVE_PLATE, payload: idx })
            }}
          >
            {plate}
          </Tag>
        ))}
        {displayInput && (
          <Input
            label={null}
            className="fr-col-md-4"
            state={state.errorMessage && "error"}
            stateRelatedMessage={state.errorMessage}
            nativeInputProps={{
              placeholder: "Numéro de plaque",
              value: state.inputPlate ?? "",
              onBlur: () => !disabled && dispatch({ type: ADD_PLATE }),
              onChange: e =>
                !disabled &&
                dispatch({ type: SET_PLATE, payload: e.target.value }),
              onKeyPress: e => {
                if (e.key === "Enter") {
                  !disabled && dispatch({ type: ADD_PLATE });
                }
              }
            }}
          />
        )}
      </div>
    </>
  );
};
