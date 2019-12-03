import gql from "graphql-tag";
import React, { useState, useEffect, useReducer } from "react";
import { Query } from "@apollo/react-components";
import { Form } from "../model";
import { DateTime } from "luxon";
import { connect, getIn, setIn } from "formik";
import useDebounce from "../../utils/use-debounce";
import formatWasteCodeEffect from "../waste-code/format-waste-code.effect";
import useDidUpdateEffect from "../../utils/use-did-update";

const GET_APPENDIX_FORMS = gql`
  query AppendixForms($emitterSiret: String!, $wasteCode: String) {
    appendixForms(siret: $emitterSiret, wasteCode: $wasteCode) {
      readableId
      emitter {
        company {
          name
        }
      }
      wasteDetails {
        code
        name
      }
      receivedAt
      quantityReceived
      processingOperationDone
    }
  }
`;
type Props = { emitterSiret: string; name: string };

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

export default connect<Props>(function FormsSelector(props) {
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  useEffect(() => formatWasteCodeEffect(wasteCodeFilter, setWasteCodeFilter), [
    wasteCodeFilter
  ]);
  const debouncedWasteCodeFilter = useDebounce(wasteCodeFilter, 500);

  const fieldValue: Form[] = getIn(props.formik.values, props.name);

  const [state, dispatch] = useReducer(reducer, {
    selected: fieldValue.map(f => f.readableId),
    quantity: getIn(props.formik.values, "wasteDetails.quantity")
  });

  useDidUpdateEffect(() => {
    props.formik.setValues({
      ...props.formik.values,
      ...setIn(props.formik.values, "wasteDetails.quantity", state.quantity),
      [props.name]: state.selected.map(s => ({ readableId: s }))
    });
  }, [state]);

  const toggleSelected = (form: Form) => {
    state.selected.find(s => s === form.readableId)
      ? dispatch({ type: "unselect", payload: form })
      : dispatch({ type: "select", payload: form });
  };
  return (
    <div>
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

      <Query
        query={GET_APPENDIX_FORMS}
        variables={{
          wasteCode: debouncedWasteCodeFilter,
          emitterSiret: props.emitterSiret
        }}
      >
        {({ loading, error, data }) => {
          if (loading) return <p>Chargement...</p>;
          if (error || !data)
            return <p>{`Erreur! ${error && error.message}`}</p>;

          const values = data.appendixForms;

          if (!values.length) {
            return (
              <div className="notification error">
                Vous n'avez actuellement aucun bordereau qui peut être inclus
                dans ce regroupement.{" "}
                {wasteCodeFilter && (
                  <span>
                    Essayez de vider le filtre sur le code déchet{" "}
                    {wasteCodeFilter} pour identifier des bordereaux
                    regroupables
                  </span>
                )}
              </div>
            );
          }

          return (
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={state.selected.length === values.length}
                      onChange={e =>
                        dispatch({
                          type: "selectAll",
                          payload: e.target.checked ? values : []
                        })
                      }
                    />
                  </th>
                  <th>Numéro</th>
                  <th>Code déchet</th>
                  <th>Expéditeur initial</th>
                  <th>Date de réception</th>
                  <th>Quantité</th>
                  <th>Opération réalisée</th>
                </tr>
              </thead>
              <tbody>
                {values.map(v => (
                  <tr key={v.readableId} onClick={() => toggleSelected(v)}>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.selected.indexOf(v.readableId) > -1}
                        onChange={() => true}
                      />
                    </td>
                    <td>{v.readableId}</td>
                    <td>
                      {v.wasteDetails.code} - {v.wasteDetails.name}
                    </td>
                    <td>{v.emitter.company.name}</td>
                    <td>{DateTime.fromISO(v.receivedAt).toLocaleString()}</td>
                    <td>{v.quantityReceived} tonnes</td>
                    <td>{v.processingOperationDone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }}
      </Query>
    </div>
  );
});
