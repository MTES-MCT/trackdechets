import { getIn, useFormikContext } from "formik";
import React, { useEffect, useReducer, useMemo } from "react";

import { Bsdasri } from "generated/graphql/types";
import BsdasriTable from "./BsdasriTable";

function reducer(
  state: { selected: string[] },
  action: { type: string; payload: Bsdasri | Bsdasri[] }
) {
  switch (action.type) {
    case "select":
      const sp = action.payload as Bsdasri;
      return {
        selected: [sp.id, ...state.selected],
      };
    case "unselect":
      const usp = action.payload as Bsdasri;
      return {
        selected: state.selected.filter(v => v !== usp.id),
      };
    case "selectAll":
      const sap = action.payload as Bsdasri[];
      return {
        selected: sap.map((v: Bsdasri) => v.id),
      };
    default:
      throw new Error();
  }
}

export default function BsdasriSelector({ name }) {
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  const [state, dispatch] = useReducer(reducer, {
    selected: getIn(values, name), //.map(f => f.id),
  });

  // memoize stored regrouped dasris
  const regroupedInDB = useMemo(() => getIn(values, name) || [], [
    name,
    values,
  ]);

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

      <BsdasriTable
        selectedItems={state.selected}
        onToggle={onToggle}
        regroupedInDB={regroupedInDB}
      />
    </>
  );
}
