import React from "react";
import { Me } from "../../login/model";
import "./Transport.scss";
import { Query, QueryResult } from "react-apollo";
import gql from "graphql-tag";
import { Form } from "../../form/model";

type Props = {
  me: Me;
  siret: string;
};

export const GET_TRANSPORT_SLIPS = gql`
  query GetSlips($siret: String, $type: FormType) {
    forms(siret: $siret, type: $type) {
      id
      readableId
      createdAt
      emitter {
        company {
          name
          siret
        }
      }
      wasteDetails {
        code
        name
        quantity
      }
    }
  }
`;

export default function Transport({ me, siret }: Props) {
  return (
    <>
      <div className="header-content">
        <h2>Mes bordereaux à transporter</h2>
      </div>

      <div>
        <Query
          query={GET_TRANSPORT_SLIPS}
          variables={{ siret, type: "TRANSPORTER" }}
        >
          {({ loading, error, data }: QueryResult<{ forms: Form[] }>) => {
            if (loading) return "Chargement...";
            if (error || !data) return "Erreur...";

            return (
              <table className="table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Emetteur</th>
                    <th>Déchet</th>
                    <th>Quantité estimée</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forms.map(form => (
                    <tr key={form.id}>
                      <td>{form.readableId}</td>
                      <td>
                        {form.emitter.company && form.emitter.company.name}
                      </td>
                      <td>
                        <div>{form.wasteDetails.code}</div>
                        <div>{form.wasteDetails.name}</div>
                      </td>
                      <td>{form.wasteDetails.quantity} tonnes</td>
                      <td>...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          }}
        </Query>
      </div>
    </>
  );
}
