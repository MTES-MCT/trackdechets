import { getIn, useFormikContext } from "formik";
import React, { useEffect, useReducer } from "react";

import { Bsdasri } from "generated/graphql/types";
import BsdasriTableGrouping from "./BsdasriTableGrouping";

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
        weights: [],
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

export default function BsdasriGroupingSelector({ name }) {
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  const [state, dispatch] = useReducer(reducer, {
    selected: getIn(values, name),
  });

  // memoize stored regrouped dasris
  const regroupedInDB = getIn(values, name) || [];

  useEffect(() => {
    setFieldValue(name, state.selected);
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
      <h4 className="form__section-heading">Groupement de Dasris</h4>
      <p className="tw-my-2">
        Vous êtes en train de créer un bordereau de groupement. Veuillez
        sélectionner ci-dessous les bordereaux à grouper.
      </p>
      <p className="tw-my-2">
        Tous les bordereaux présentés ci-dessous correspondent à des bordereaux
        dasris pour lesquels vous avez effectué une opération de traitement de
        type R 12 ou D 12.
      </p>

      <BsdasriTableGrouping
        selectedItems={state.selected}
        onToggle={onToggle}
        regroupedInDB={regroupedInDB}
      />
    </>
  );
}
