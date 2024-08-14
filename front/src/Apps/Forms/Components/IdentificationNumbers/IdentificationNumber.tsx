import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { useEffect, useReducer, useRef } from "react";
import { useFormContext } from "react-hook-form";
import TdTooltip from "../../../../common/components/Tooltip";
import "./identificationNumber.scss";
interface IdentificationNumberProps {
  title?: string;
  name: string;
  disabled: boolean;
  error?: {};
  type?: string;
  defaultValue?: (string | undefined)[] | null | undefined;
}
const IdentificationNumber = ({
  title = "Détail des identifications",
  name,
  disabled,
  error,
  type,
  defaultValue
}: IdentificationNumberProps) => {
  const { setValue, getValues } = useFormContext();

  const SET_INPUT_CODE = "set_input_code";
  const ADD_CODE = "add_code";
  const REMOVE_CODE = "remove_code";

  function identificationNumberReducer(state, action) {
    switch (action.type) {
      case SET_INPUT_CODE:
        return { ...state, inputCode: action.payload };
      case ADD_CODE: {
        if (!state.codes.length && defaultValue?.length) {
          return {
            ...state,
            codes: [...state.codes, ...defaultValue],
            inputCode: ""
          };
        }
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

  const [state, dispatch] = useReducer(identificationNumberReducer, {
    codes: getValues(name),
    inputCode: ""
  });

  useEffect(() => {
    setValue(name, state.codes);
  }, [state, name, setValue]);

  useEffect(() => {
    if (defaultValue) {
      dispatch({ type: ADD_CODE, payload: defaultValue });
    }
  }, [defaultValue]);

  return (
    <>
      <p>
        {title}
        <TdTooltip msg="Saisissez les identifications une par une. Appuyez sur la touche <Entrée> pour valider chacune" />
      </p>
      <div className="fr-grid-row fr-grid-row--bottom multiTags">
        {state?.codes?.map((code, idx) => (
          <Tag
            dismissible
            key={idx}
            className="fr-mr-2v"
            nativeButtonProps={{
              type: "button",
              onClick: () =>
                !disabled && dispatch({ type: REMOVE_CODE, payload: idx }),
              ...{ "data-testid": "tagInputIdentificationNumber" }
            }}
          >
            {code}
          </Tag>
        ))}

        {!disabled && (
          <input
            type="text"
            data-testid="identificationNumberInput"
            ref={tagInputRef}
            className="multiTagsInput"
            placeholder="Code…"
            onChange={e =>
              dispatch({ type: SET_INPUT_CODE, payload: e.target.value })
            }
            onKeyUp={e => {
              if (e.key === "Enter") {
                setTag();
              }
            }}
            onKeyPress={e => {
              // to avoid submitting a form on enter tag
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            onBlur={() => {
              setTag();
            }}
          />
        )}
      </div>
      {type && (
        <p className={`${error ? "fr-error-text" : "fr-info-text"} fr-mt-5v`}>
          Vous avez {state.codes.length} {type} pour ce contenant
        </p>
      )}
    </>
  );
};

export default IdentificationNumber;
