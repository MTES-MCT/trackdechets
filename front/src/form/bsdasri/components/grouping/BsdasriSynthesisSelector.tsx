import { getIn, useFormikContext } from "formik";
import React, { useEffect, useReducer } from "react";
import { useQuery } from "@apollo/client";
import { Bsdasri } from "@td/codegen-ui";
import BsdasriTableSynthesis from "./BsdasriTableSynthesis";
import { GET_DETAIL_DASRI } from "../../../../Apps/common/queries";

import { Query, QueryBsdasriArgs } from "@td/codegen-ui";
type State = { selected: string[] };

type Action =
  | { type: "select"; payload: Bsdasri }
  | { type: "unselect"; payload: Bsdasri }
  | { type: "selectAll"; payload: Bsdasri[] };

function reducer(state: State, action: Action) {
  switch (action.type) {
    case "select": {
      const sp = action.payload;
      return {
        selected: [sp.id, ...state.selected]
      };
    }
    case "unselect": {
      const usp = action.payload;

      return {
        selected: state.selected.filter(v => v !== usp.id)
      };
    }
    case "selectAll": {
      const sap = action.payload;
      return {
        selected: sap.map(v => v.id)
      };
    }
    default:
      throw new Error("Unknown action type");
  }
}

export default function BsdasriSelectorForSynthesis({ disabled }) {
  const { values, setFieldValue } = useFormikContext<Bsdasri>();

  const { data } = useQuery<Pick<Query, "bsdasri">, QueryBsdasriArgs>(
    GET_DETAIL_DASRI,
    {
      variables: {
        id: values?.id
      },
      fetchPolicy: "network-only",
      skip: !values?.id
    }
  );

  const [state, dispatch] = useReducer(reducer, {
    selected: getIn(values, "synthesizing")
  });

  const regroupedInDB = !!data
    ? data.bsdasri?.synthesizing?.map(dasri => dasri.id)
    : [];

  useEffect(() => {
    setFieldValue(
      "synthesizing",
      state.selected.map(s => s)
    );
  }, [state, setFieldValue]);

  function onToggle(payload: Bsdasri | Bsdasri[]) {
    if (Array.isArray(payload)) {
      return dispatch({
        type: "selectAll",
        payload
      });
    }

    state.selected.find(s => s === payload.id)
      ? dispatch({ type: "unselect", payload })
      : dispatch({ type: "select", payload });
  }

  return (
    <>
      {disabled ? (
        <h4 className="form__section-heading">Bordereaux associés</h4>
      ) : (
        <>
          {" "}
          <h4 className="form__section-heading">Bordereaux à associer</h4>
          <p className="tw-my-2">
            Veuillez sélectionner ci-dessous les bordereaux à associer.
          </p>
        </>
      )}

      <BsdasriTableSynthesis
        selectedItems={state.selected}
        onToggle={onToggle}
        regroupedInDB={regroupedInDB}
        disabled={disabled}
      />
    </>
  );
}
