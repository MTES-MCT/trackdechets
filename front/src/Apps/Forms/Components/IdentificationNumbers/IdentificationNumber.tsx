import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { useEffect, useReducer, useRef } from "react";
import { useFormContext } from "react-hook-form";
import classNames from "classnames";
import Tooltip from "../../../common/Components/Tooltip/Tooltip";
import "./identificationNumber.scss";
interface IdentificationNumberProps {
  title?: string;
  name: string;
  disabled: boolean;
  error?: {};
  infoMessage?: string;
  defaultValue?: (string | undefined)[] | null | undefined;
}
const IdentificationNumber = ({
  title = "Détail des identifications",
  name,
  disabled,
  error,
  infoMessage,
  defaultValue
}: IdentificationNumberProps) => {
  const { setValue, getValues, clearErrors } = useFormContext();

  const SET_INPUT_CODE = "set_input_code";
  const ADD_CODE = "add_code";
  const REMOVE_CODE = "remove_code";

  function identificationNumberReducer(state, action) {
    switch (action.type) {
      case SET_INPUT_CODE:
        return { ...state, inputCode: action.payload, touched: true };

      case ADD_CODE: {
        if (!state.codes.length && defaultValue?.length && !state.touched) {
          // initial
          return {
            ...state,
            codes: [...state.codes, ...defaultValue],
            inputCode: "",
            touched: true
          };
        }
        if (!state.inputCode || state.codes.includes(state.inputCode)) {
          return state;
        }

        return {
          ...state,
          codes: [...state.codes, state.inputCode],
          inputCode: "",
          touched: true
        };
      }
      case REMOVE_CODE: {
        const codes = [...state.codes];
        codes.splice(action.payload, 1);

        return {
          ...state,
          codes: [...codes]
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
    inputCode: "",
    touched: false
  });

  useEffect(() => {
    setValue(name, state.codes);
    clearErrors(name);
  }, [state, name, setValue, clearErrors]);

  useEffect(() => {
    if (defaultValue) {
      dispatch({ type: ADD_CODE, payload: defaultValue });
    }
  }, [defaultValue]);

  return (
    <>
      <p className={classNames("multiTags-title", { error: !!error })}>
        {title}
        <Tooltip
          className="fr-ml-1w"
          title="Saisissez les identifications une par une. Appuyez sur la touche <Entrée> pour valider chacune"
        />
      </p>
      <div
        className={classNames(
          "fr-grid-row",
          "fr-grid-row--bottom",
          "multiTags",
          { error: !!error }
        )}
      >
        {state?.codes?.map((code, idx) => (
          <Tag
            dismissible
            key={idx}
            className="fr-mr-2v"
            nativeButtonProps={{
              type: "button",
              onClick: () => {
                return (
                  !disabled && dispatch({ type: REMOVE_CODE, payload: idx })
                );
              },
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
      {infoMessage && (
        <p
          className={classNames(
            "fr-mt-5v",
            error ? "fr-error-text" : "fr-info-text"
          )}
        >
          {infoMessage.replace("%", state.codes.length)}
        </p>
      )}
    </>
  );
};

export default IdentificationNumber;
