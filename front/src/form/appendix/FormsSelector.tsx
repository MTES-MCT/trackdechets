import { getIn, useFormikContext } from "formik";
import React, { useEffect, useReducer, useState } from "react";
import useDebounce from "../../utils/use-debounce";
import { Form } from "../model";
import formatWasteCodeEffect from "../waste-code/format-waste-code.effect";
import FormsTable from "./FormsTable";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function reducer(
  state: { selected: string[]; quantity: number },
  action: { type: string; payload: Form | Form[] }
) {
  switch (action.type) {
    case "select":
      const sp = action.payload as Form;
      return {
        selected: [sp.readableId, ...state.selected],
        quantity: round(state.quantity + sp.quantityReceived)
      };
    case "unselect":
      const usp = action.payload as Form;
      return {
        selected: state.selected.filter(v => v !== usp.readableId),
        quantity: round(state.quantity - usp.quantityReceived)
      };
    case "selectAll":
      const sap = action.payload as Form[];
      return {
        selected: sap.map((v: Form) => v.readableId),
        quantity: round(
          sap.reduce(
            (prev: number, cur: Form) => (prev += cur.quantityReceived),
            0
          )
        )
      };
    default:
      throw new Error();
  }
}

export default function FormsSelector({ name }) {
  const { values, setFieldValue } = useFormikContext<Form>();

  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const debouncedWasteCodeFilter = useDebounce(wasteCodeFilter, 500);
  useEffect(() => {
    formatWasteCodeEffect(wasteCodeFilter, setWasteCodeFilter);
  }, [wasteCodeFilter]);

  const [state, dispatch] = useReducer(reducer, {
    selected: getIn(values, name).map(f => f.readableId),
    quantity: getIn(values, "wasteDetails.quantity")
  });

  useEffect(() => {
    setFieldValue(
      name,
      state.selected.map(s => ({ readableId: s }))
    );
    setFieldValue("wasteDetails.quantity", state.quantity);
  }, [state, name, setFieldValue]);

  function onToggle(payload: Form | Form[]) {
    if (Array.isArray(payload)) {
      return dispatch({
        type: "selectAll",
        payload
      });
    }

    state.selected.find(s => s === payload.readableId)
      ? dispatch({ type: "unselect", payload })
      : dispatch({ type: "select", payload });
  }

  return (
    <>
      <h4>Annexe 2</h4>
      <p>
        Vous êtes en train de créer un bordereau de regroupement. Veuillez
        sélectionner ci-dessous les bordereaux à regrouper.
      </p>
      <p>
        Tous les bordereaux présentés ci-dessous correspondent à des bordereaux
        pour lesquels vous avez effectué une opération de traitement de type D
        13, D 14, D 15 ou R 13.
      </p>

      <p>
        Pour affiner votre sélection, vous avez la possibilité de filtrer par
        code déchet.
        <input
          type="text"
          placeholder="Filtre optionnel..."
          value={wasteCodeFilter}
          onChange={e => setWasteCodeFilter(e.target.value)}
        />
      </p>

      <FormsTable
        wasteCode={debouncedWasteCodeFilter}
        selectedItems={state.selected}
        onToggle={onToggle}
      />
    </>
  );
}
