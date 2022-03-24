import { getIn, useFormikContext } from "formik";
import React, { useEffect, useReducer } from "react";

import { Bsdasri } from "generated/graphql/types";
import BsdasriTableSynthesis from "./BsdasriTableSynthesis";

type State = { selected: string[] };

type Action =
  | { type: "select"; payload: Bsdasri }
  | { type: "unselect"; payload: Bsdasri }
  | { type: "selectAll"; payload: Bsdasri[] };

function reducer(state: State, action: Action) {
  switch (action.type) {
    case "select":
      const sp = action.payload;
      return {
        selected: [sp.id, ...state.selected],
      };
    case "unselect":
      const usp = action.payload;

      return {
        selected: state.selected.filter(v => v !== usp.id),
      };
    case "selectAll":
      const sap = action.payload;
      return {
        selected: sap.map(v => v.id),
      };
    default:
      throw new Error("Unknown action type");
  }
}

export default function BsdasriSelectorForSynthesis({ name }) {
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  const [state, dispatch] = useReducer(reducer, {
    selected: getIn(values, name),
  });

  // memoize stored regrouped dasris
  const regroupedInDB = getIn(values, name) || [];

  useEffect(() => {
    setFieldValue(
      name,
      state.selected.map(s => s)
    );
  }, [state, name, setFieldValue]);

  function onToggle(payload: Bsdasri | Bsdasri[]) {
    if (Array.isArray(payload)) {
      return dispatch({
        type: "selectAll",
        payload,
      });
    }

    state.selected.find(s => s === payload.id)
      ? dispatch({ type: "unselect", payload })
      : dispatch({ type: "select", payload });
  }

  return (
    <>
      <h4 className="form__section-heading">Dasri de synthèse</h4>
      <p className="tw-my-2">
        Vous êtes en train de créer un bordereau de synthèse. Veuillez
        sélectionner ci-dessous les bordereaux à associer.
      </p>
      <p className="tw-my-2">
        Tous les bordereaux présentés ci-dessous correspondent à des bordereaux
        dasris que vous avez pris en charge
      </p>

      <BsdasriTableSynthesis
        selectedItems={state.selected}
        onToggle={onToggle}
        regroupedInDB={regroupedInDB}
      />
    </>
  );
}
