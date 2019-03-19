import gql from "graphql-tag";
import React, { useState, useEffect } from "react";
import { Query, QueryResult } from "react-apollo";
import { wasteCodeValidator } from "../waste-code/waste-code.validator";
import { Form } from "../model";
import { DateTime } from "luxon";
import { connect, getIn, setIn, Formik } from "formik";

const GET_APPENDIX_FORMS = gql`
  query AppendixForms($emittersiret: String!, $wasteCode: String!) {
    appendixForms(emitterSiret: $emitterSiret, wasteCode: $wasteCode) {
      readableId
      emitter {
        company {
          name
        }
      }
      receivedAt
      quantityReceived
      processingOperationDone
    }
  }
`;
type Props = { emiterSiret: string; wasteCode: string; name: string };

export default connect<Props>(function FormsSelector(props) {
  if (wasteCodeValidator(props.wasteCode) != null) {
    return (
      <p>
        Veuillez renseigner le code déchet avant de pouvoir associer des
        bordereaux en annexe.
      </p>
    );
  }

  const fieldValue: Form[] = getIn(props.formik.values, props.name);
  const [selected, setSelected] = useState(fieldValue.map(f => f.readableId));

  useEffect(() => {
    props.formik.setValues({
      ...props.formik.values,
      [props.name]: selected.map(s => ({ readableId: s }))
    });
  }, [selected]);

  const toggleSelected = (id: string) => {
    selected.indexOf(id) > -1
      ? setSelected(selected.filter(v => v !== id))
      : setSelected([id, ...selected]);
  };
  return (
    <div>
      <h4>Annexe 2</h4>
      <p>
        Vous êtes entrain de créer un bordereau de regroupement. Veuillez
        sélectionner ci-dessous les bordereaux à regrouper.
      </p>
      <p>
        Tous les bordereaux présentés ci-dessous correspondent au code déchet
        que vous avez renseigné, et à des bordereaux pour lequel vous avez
        effectué une opération de traitement de type D 13, D 14, D 15 ou R 13.
      </p>

      <Query
        query={GET_APPENDIX_FORMS}
        variables={{ wasteCode: props.wasteCode }}
      >
        {({ loading, error, data }: QueryResult<{ appendixForms: Form[] }>) => {
          if (loading) return "Chargement...";
          if (error || !data) return `Erreur! ${error && error.message}`;

          const values = data.appendixForms;

          if (!values.length) {
            return (
              <div className="notification error">
                Vous n'avez actuellement aucun bordereau qui peut être inclus
                dans ce regroupement.
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
                      checked={selected.length === values.length}
                      onChange={e =>
                        e.target.checked
                          ? setSelected(values.map(v => v.readableId))
                          : setSelected([])
                      }
                    />
                  </th>
                  <th>Numéro</th>
                  <th>Expéditeur initial</th>
                  <th>Date de réception</th>
                  <th>Quantité</th>
                  <th>Opération réalisée</th>
                </tr>
              </thead>
              <tbody>
                {values.map(v => (
                  <tr
                    key={v.readableId}
                    onClick={() => toggleSelected(v.readableId)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.indexOf(v.readableId) > -1}
                        onChange={() => toggleSelected(v.readableId)}
                      />
                    </td>
                    <td>{v.readableId}</td>
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
